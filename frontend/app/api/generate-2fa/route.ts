/**
 * NextJS API Route: generate-2fa
 * Generates TOTP secrets with QR codes for COFRAP Authentication System.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CryptoManager } from '@/lib/server/crypto';
import { DatabaseManager } from '@/lib/server/database';
import { TOTPManager, QRCodeGenerator, TimeUtils, ResponseUtils } from '@/lib/server/utils';

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
    const { username } = body;
    if (!username) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Username is required", "MISSING_USERNAME"),
        { status: 400 }
      );
    }

    // Validate username format
    if (typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        ResponseUtils.errorResponse("Username must be a non-empty string", "INVALID_USERNAME"),
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Validate username length
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return NextResponse.json(
        ResponseUtils.errorResponse(
          "Username must be between 3 and 50 characters",
          "INVALID_USERNAME_LENGTH"
        ),
        { status: 400 }
      );
    }

    // Initialize managers
    const cryptoManager = new CryptoManager();
    const dbManager = new DatabaseManager();
    console.log(`🔑 [generate-2fa] Initialized managers for user: ${trimmedUsername}`);

    // Check if user exists in database
    try {
      const user = dbManager.getUser(trimmedUsername);
      if (!user) {
        return NextResponse.json(
          ResponseUtils.errorResponse(
            `User ${trimmedUsername} not found. Please generate password first.`,
            "USER_NOT_FOUND"
          ),
          { status: 404 }
        );
      }
    } catch (error) {
      console.error(`Database error checking user: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Database error occurred", "DATABASE_ERROR"),
        { status: 500 }
      );
    }

    // Generate TOTP secret
    console.log(`🔑 Generating TOTP secret for user: ${trimmedUsername}`);
    let totpSecret: string;
    try {
      totpSecret = TOTPManager.generateSecret();
    } catch (error) {
      console.error(`TOTP secret generation failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("TOTP secret generation failed", "TOTP_GENERATION_ERROR"),
        { status: 500 }
      );
    }

    // Generate TOTP URI for authenticator apps
    console.log(`📱 Generating TOTP URI for user: ${trimmedUsername}`);
    let totpUri: string;
    try {
      totpUri = TOTPManager.generateTOTPUri(
        totpSecret,
        trimmedUsername,
        "COFRAP"
      );
    } catch (error) {
      console.error(`TOTP URI generation failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("TOTP URI generation failed", "TOTP_URI_ERROR"),
        { status: 500 }
      );
    }

    // Generate QR code for the TOTP URI
    console.log(`🎯 Generating QR code for TOTP`);
    let qrcodeBase64: string;
    try {
      qrcodeBase64 = await QRCodeGenerator.generateQRCode(
        totpUri,
        `COFRAP 2FA - ${trimmedUsername}`
      );
    } catch (error) {
      console.error(`QR code generation failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("QR code generation failed", "QRCODE_GENERATION_ERROR"),
        { status: 500 }
      );
    }

    // Encrypt the TOTP secret before storing
    let encryptedSecret: string;
    try {
      encryptedSecret = cryptoManager.encryptData(totpSecret);
    } catch (error) {
      console.error(`TOTP secret encryption failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("TOTP secret encryption failed", "ENCRYPTION_ERROR"),
        { status: 500 }
      );
    }

    // Get current timestamp
    const currentTimestamp = TimeUtils.getCurrentTimestamp();

    // Update user's MFA secret in database
    try {
      const success = dbManager.updateUserMFA(
        trimmedUsername,
        encryptedSecret,
        currentTimestamp
      );

      if (!success) {
        return NextResponse.json(
          ResponseUtils.errorResponse("Failed to store TOTP secret", "DATABASE_UPDATE_ERROR"),
          { status: 500 }
        );
      }
    } catch (error) {
      console.error(`Database update failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Database update failed", "DATABASE_ERROR"),
        { status: 500 }
      );
    }

    // Return success response
    console.log(`✅ TOTP secret generated successfully for user: ${trimmedUsername}`);
    return NextResponse.json(
      ResponseUtils.successResponse({
        totp_uri: totpUri,
        qrcode_base64: qrcodeBase64,
        username: trimmedUsername,
        secret_length: totpSecret.length,
        generated_at: TimeUtils.formatTimestamp(currentTimestamp),
        instructions: "Scan this QR code with Google Authenticator, Authy, or similar TOTP app"
      }, `TOTP secret generated successfully for user ${trimmedUsername}`)
    );

  } catch (error) {
    console.error(`❌ Unexpected error in generate-2fa function: ${error}`);
    return NextResponse.json(
      ResponseUtils.errorResponse("Internal server error", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
} 