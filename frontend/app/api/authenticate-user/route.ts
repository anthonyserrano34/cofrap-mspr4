/**
 * NextJS API Route: authenticate-user
 * Authenticates users with password and TOTP code, checking for expiration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CryptoManager } from '@/lib/server/crypto';
import { DatabaseManager } from '@/lib/server/database';
import { TOTPManager, TimeUtils, ResponseUtils } from '@/lib/server/utils';

export async function POST(request: NextRequest) {
  try {
    // Parse input
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Request body is required", "MISSING_REQUEST_BODY"),
        { status: 400 }
      );
    }

    // Validate required fields
    const { username, password, totp_code } = body;

    if (!username) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Username is required", "MISSING_USERNAME"),
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Password is required", "MISSING_PASSWORD"),
        { status: 400 }
      );
    }

    if (!totp_code) {
      return NextResponse.json(
        ResponseUtils.errorResponse("TOTP code is required", "MISSING_TOTP_CODE"),
        { status: 400 }
      );
    }

    // Validate input formats
    if (typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Username must be a non-empty string", "INVALID_USERNAME"),
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Password must be a non-empty string", "INVALID_PASSWORD"),
        { status: 400 }
      );
    }

    if (typeof totp_code !== 'string' || totp_code.length !== 6 || !/^\d{6}$/.test(totp_code)) {
      return NextResponse.json(
        ResponseUtils.errorResponse("TOTP code must be a 6-digit string", "INVALID_TOTP_CODE"),
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Initialize managers
    const cryptoManager = new CryptoManager();
    const dbManager = new DatabaseManager();

    // Get user from database
    let user;
    try {
      user = dbManager.getUser(trimmedUsername);
      if (!user) {
        console.warn(`Authentication failed - user not found: ${trimmedUsername}`);
        return NextResponse.json({
          authenticated: false,
          expired: false,
          message: "Invalid credentials",
          success: false,
          timestamp: TimeUtils.getCurrentTimestamp()
        }, { status: 401 });
      }
    } catch (error) {
      console.error(`Database error retrieving user: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Database error occurred", "DATABASE_ERROR"),
        { status: 500 }
      );
    }

    // Check if account is already marked as expired
    if (user.expired) {
      console.log(`User ${trimmedUsername} account is marked as expired`);
      return NextResponse.json({
        authenticated: false,
        expired: true,
        message: "Account expired. Please regenerate credentials.",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 401 });
    }

    // Check if credentials are expired (6 months)
    const userGendate = user.gendate || 0;
    if (TimeUtils.isExpired(userGendate, 6)) {
      console.log(`User ${trimmedUsername} credentials expired based on gendate`);

      // Mark user as expired in database
      try {
        dbManager.markUserExpired(trimmedUsername);
      } catch (error) {
        console.error(`Failed to mark user as expired: ${error}`);
      }

      return NextResponse.json({
        authenticated: false,
        expired: true,
        message: "Credentials expired (6 months). Please regenerate credentials.",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp(),
        expired_since: TimeUtils.formatTimestamp(userGendate)
      }, { status: 401 });
    }

    // Verify password
    const storedPasswordHash = user.password_hash;
    if (!storedPasswordHash) {
      console.error(`No password hash found for user: ${trimmedUsername}`);
      return NextResponse.json({
        authenticated: false,
        expired: false,
        message: "Invalid credentials",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 401 });
    }

    let passwordValid: boolean;
    try {
      passwordValid = await cryptoManager.verifyPassword(password, storedPasswordHash);
    } catch (error) {
      console.error(`Password verification error: ${error}`);
      return NextResponse.json({
        authenticated: false,
        expired: false,
        message: "Authentication error",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 500 });
    }

    if (!passwordValid) {
      console.warn(`Authentication failed - invalid password for user: ${trimmedUsername}`);
      return NextResponse.json({
        authenticated: false,
        expired: false,
        message: "Invalid credentials",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 401 });
    }

    // Verify TOTP code
    const storedMfaSecret = user.mfa_secret;
    if (!storedMfaSecret) {
      console.error(`No MFA secret found for user: ${trimmedUsername}`);
      return NextResponse.json({
        authenticated: false,
        expired: false,
        message: "MFA not configured. Please configure 2FA first.",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 401 });
    }

    // Decrypt the MFA secret
    let decryptedSecret: string;
    try {
      decryptedSecret = cryptoManager.decryptData(storedMfaSecret);
    } catch (error) {
      console.error(`MFA secret decryption failed: ${error}`);
      return NextResponse.json({
        authenticated: false,
        expired: false,
        message: "MFA configuration error",
        success: false,
        timestamp: TimeUtils.getCurrentTimestamp()
      }, { status: 500 });
    }

    // Skip TOTP verification if it's the placeholder secret
    let totpValid = true;
    if (decryptedSecret !== "PLACEHOLDER_MFA_SECRET") {
      try {
        totpValid = TOTPManager.verifyTOTPCode(decryptedSecret, totp_code, 1);
      } catch (error) {
        console.error(`TOTP verification error: ${error}`);
        return NextResponse.json({
          authenticated: false,
          expired: false,
          message: "TOTP verification error",
          success: false,
          timestamp: TimeUtils.getCurrentTimestamp()
        }, { status: 500 });
      }

      if (!totpValid) {
        console.warn(`Authentication failed - invalid TOTP code for user: ${trimmedUsername}`);
        return NextResponse.json({
          authenticated: false,
          expired: false,
          message: "Invalid TOTP code",
          success: false,
          timestamp: TimeUtils.getCurrentTimestamp()
        }, { status: 401 });
      }
    } else {
      console.warn(`User ${trimmedUsername} has placeholder MFA secret - skipping TOTP verification`);
    }

    // Calculate credentials age for info
    const currentTime = TimeUtils.getCurrentTimestamp();
    const credentialsAgeDays = Math.floor((currentTime - userGendate) / (24 * 60 * 60));

    // Authentication successful
    console.log(`✅ Authentication successful for user: ${trimmedUsername}`);
    return NextResponse.json({
      authenticated: true,
      expired: false,
      username: trimmedUsername,
      credentials_age_days: credentialsAgeDays,
      message: "Authentication successful",
      success: true,
      timestamp: currentTime
    });

  } catch (error) {
    console.error(`❌ Unexpected error in authenticate-user function: ${error}`);
    return NextResponse.json(
      ResponseUtils.errorResponse("Internal server error", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
} 