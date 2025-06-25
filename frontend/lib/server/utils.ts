/**
 * Utility functions for COFRAP Authentication System
 * Handles password generation, QR code creation, TOTP operations, and common utilities.
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';

export class PasswordGenerator {
  /**
   * Generate a complex password with specified requirements.
   */
  static generateComplexPassword(length: number = 24): string {
    if (length < 24) {
      throw new Error('Password length must be at least 24 characters');
    }

    // Define character sets
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Ensure at least one character from each category
    const passwordChars: string[] = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specialChars[Math.floor(Math.random() * specialChars.length)]
    ];

    // Fill remaining positions with random choices from all sets
    const allChars = uppercase + lowercase + digits + specialChars;
    for (let i = 0; i < length - 4; i++) {
      passwordChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Shuffle the password to avoid predictable patterns
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    const password = passwordChars.join('');
    console.log(`Generated complex password of length ${length}`);
    return password;
  }

  /**
   * Validate if password meets complexity requirements.
   */
  static validatePasswordComplexity(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 24) {
      errors.push('Password must be at least 24 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one digit');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class QRCodeGenerator {
  /**
   * Generate a QR code image from data.
   */
  static async generateQRCode(data: string, title: string = 'COFRAP Auth'): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        quality: 0.92,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Extract base64 part from data URL
      const base64Data = qrCodeDataUrl.split(',')[1];
      console.log(`QR code generated successfully for ${title}`);
      return base64Data;
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw error;
    }
  }
}

export class TOTPManager {
  /**
   * Generate a new TOTP secret.
   */
  static generateSecret(): string {
    try {
      const secret = authenticator.generateSecret();
      console.log('TOTP secret generated successfully');
      return secret;
    } catch (error) {
      console.error('TOTP secret generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate TOTP URI for authenticator apps.
   */
  static generateTOTPUri(secret: string, username: string, issuer: string = 'COFRAP'): string {
    try {
      const uri = authenticator.keyuri(username, issuer, secret);
      console.log(`TOTP URI generated for user ${username}`);
      return uri;
    } catch (error) {
      console.error('TOTP URI generation failed:', error);
      throw error;
    }
  }

  /**
   * Verify a TOTP code against the secret.
   */
  static verifyTOTPCode(secret: string, code: string, window: number = 1): boolean {
    try {
      // Configure otplib with window tolerance
      authenticator.options = { window };
      const isValid = authenticator.verify({ token: code, secret });
      console.log(`TOTP verification: ${isValid ? 'success' : 'failed'}`);
      return isValid;
    } catch (error) {
      console.error('TOTP verification failed:', error);
      return false;
    }
  }

  /**
   * Get current TOTP code for testing purposes.
   */
  static getCurrentTOTPCode(secret: string): string {
    try {
      const code = authenticator.generate(secret);
      console.log('Current TOTP code generated for testing');
      return code;
    } catch (error) {
      console.error('TOTP code generation failed:', error);
      throw error;
    }
  }
}

export class TimeUtils {
  /**
   * Get current Unix timestamp.
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Check if timestamp is expired based on max age in months.
   */
  static isExpired(timestamp: number, maxAgeMonths: number = 6): boolean {
    if (!timestamp || timestamp <= 0) {
      return true;
    }

    const currentTime = this.getCurrentTimestamp();
    const maxAgeSeconds = maxAgeMonths * 30 * 24 * 60 * 60; // approximate months to seconds
    const ageSeconds = currentTime - timestamp;

    return ageSeconds > maxAgeSeconds;
  }

  /**
   * Format timestamp for display.
   */
  static formatTimestamp(timestamp: number): string {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Paris'
      });
    } catch (error) {
      console.error('Timestamp formatting failed:', error);
      return 'Format invalide';
    }
  }
}

export class ResponseUtils {
  /**
   * Create success response.
   */
  static successResponse(data: any = null, message: string = 'Operation successful') {
    return {
      success: true,
      message,
      timestamp: TimeUtils.getCurrentTimestamp(),
      ...data
    };
  }

  /**
   * Create error response.
   */
  static errorResponse(message: string = 'Operation failed', errorCode?: string) {
    return {
      success: false,
      message,
      error_code: errorCode,
      timestamp: TimeUtils.getCurrentTimestamp()
    };
  }

  /**
   * Create validation error response.
   */
  static validationErrorResponse(errors: string[]) {
    return {
      success: false,
      message: 'Validation failed',
      error_code: 'VALIDATION_ERROR',
      errors,
      timestamp: TimeUtils.getCurrentTimestamp()
    };
  }
} 