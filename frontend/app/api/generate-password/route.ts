/**
 * NextJS API Route: generate-password
 * Generates secure passwords with QR codes for COFRAP Authentication System.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CryptoManager } from '@/lib/server/crypto';
import { DatabaseManager } from '@/lib/server/database';
import { PasswordGenerator, QRCodeGenerator, TimeUtils, ResponseUtils } from '@/lib/server/utils';

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

    // Generate password
    console.log(`🔐 Generating password for user: ${trimmedUsername}`);
    const password = PasswordGenerator.generateComplexPassword(24);

    // Validate generated password
    const { isValid, errors } = PasswordGenerator.validatePasswordComplexity(password);
    if (!isValid) {
      console.error(`Generated password failed validation: ${errors}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Password generation failed validation", "PASSWORD_GENERATION_ERROR"),
        { status: 500 }
      );
    }

    // Generate QR code for the password
    console.log(`📱 Generating QR code for password`);
    let qrcodeBase64: string;
    try {
      const qrData = `COFRAP Password for ${trimmedUsername}: ${password}`;
      qrcodeBase64 = await QRCodeGenerator.generateQRCode(
        qrData,
        `COFRAP Password - ${trimmedUsername}`
      );
    } catch (error) {
      console.error(`QR code generation failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("QR code generation failed", "QRCODE_GENERATION_ERROR"),
        { status: 500 }
      );
    }

    // Initialize crypto and database managers
    const cryptoManager = new CryptoManager();
    const dbManager = new DatabaseManager();
    console.log(`🔐 [generate-password] Initialized managers for user: ${trimmedUsername}`);

    // Hash the password
    let passwordHash: string;
    try {
      passwordHash = await cryptoManager.hashPassword(password);
    } catch (error) {
      console.error(`Password hashing failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Password hashing failed", "PASSWORD_HASHING_ERROR"),
        { status: 500 }
      );
    }

    // Generate placeholder MFA secret (will be updated by generate-2fa endpoint)
    const placeholderMfa = cryptoManager.encryptData("PLACEHOLDER_MFA_SECRET");

    // Get current timestamp
    const currentTimestamp = TimeUtils.getCurrentTimestamp();

    // Store in database
    try {
      const success = dbManager.insertUser(
        trimmedUsername,
        passwordHash,
        placeholderMfa,
        currentTimestamp
      );

      if (!success) {
        return NextResponse.json(
          ResponseUtils.errorResponse("Failed to store user credentials", "DATABASE_ERROR"),
          { status: 500 }
        );
      }
    } catch (error) {
      console.error(`Database operation failed: ${error}`);
      return NextResponse.json(
        ResponseUtils.errorResponse("Database operation failed", "DATABASE_ERROR"),
        { status: 500 }
      );
    }

    // Return success response
    console.log(`✅ Password generated successfully for user: ${trimmedUsername}`);
    return NextResponse.json(
      ResponseUtils.successResponse({
        password: password,
        qrcode_base64: qrcodeBase64,
        username: trimmedUsername,
        generated_at: TimeUtils.formatTimestamp(currentTimestamp)
      }, `Password generated successfully for user ${trimmedUsername}`)
    );

  } catch (error) {
    console.error(`❌ Unexpected error in generate-password function: ${error}`);
    return NextResponse.json(
      ResponseUtils.errorResponse("Internal server error", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
} 