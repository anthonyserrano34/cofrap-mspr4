/**
 * Cryptographic utilities for COFRAP Authentication System
 * Handles password hashing, data encryption/decryption, and secure operations.
 */

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export class CryptoManager {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = this.getOrGenerateKey();
  }

  private getOrGenerateKey(): string {
    // Try to get key from environment variable
    const keyFromEnv = process.env.ENCRYPTION_KEY;
    
    if (keyFromEnv) {
      try {
        // Validate it's a proper 32-byte key
        if (keyFromEnv.length === 64) { // hex string of 32 bytes
          return keyFromEnv;
        }
      } catch (error) {
        console.warn('Invalid encryption key in environment:', error);
      }
    }

    // Use a fixed key for demo purposes (NOT for production!)
    const fixedKey = 'a'.repeat(64); // 32 bytes in hex = 64 characters
    console.warn('Using fixed encryption key for demo - NOT secure for production!');
    console.warn('Please set ENCRYPTION_KEY environment variable for production!');
    return fixedKey;
  }

  /**
   * Hash a password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      const hashed = await bcrypt.hash(password, saltRounds);
      console.log('Password hashed successfully');
      return hashed;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw error;
    }
  }

  /**
   * Verify a password against its hash.
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await bcrypt.compare(password, hashedPassword);
      console.log(`Password verification: ${result ? 'success' : 'failed'}`);
      return result;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Encrypt sensitive data.
   */
  encryptData(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(this.encryptionKey, 'hex');
      
      // Ensure key is exactly 32 bytes
      if (key.length !== 32) {
        throw new Error(`Invalid key length: expected 32 bytes, got ${key.length}`);
      }
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const result = iv.toString('hex') + ':' + encrypted;
      console.log('Data encrypted successfully');
      return Buffer.from(result).toString('base64');
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data.
   */
  decryptData(encryptedData: string): string {
    try {
      const decoded = Buffer.from(encryptedData, 'base64').toString();
      const parts = decoded.split(':');
      
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = Buffer.from(this.encryptionKey, 'hex');
      
      // Ensure key is exactly 32 bytes
      if (key.length !== 32) {
        throw new Error(`Invalid key length: expected 32 bytes, got ${key.length}`);
      }
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log('Data decrypted successfully');
      return decrypted;
    } catch (error) {
      console.error('Data decryption failed:', error);
      throw error;
    }
  }

  /**
   * Securely compare two strings to prevent timing attacks.
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
} 