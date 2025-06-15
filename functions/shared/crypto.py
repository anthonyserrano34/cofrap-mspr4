"""
Cryptographic utilities for COFRAP Authentication System
Handles password hashing, data encryption/decryption, and secure operations.
"""

import os
import bcrypt
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CryptoManager:
    """Manages cryptographic operations for the authentication system."""
    
    def __init__(self):
        """Initialize the crypto manager with encryption key."""
        self.encryption_key = self._get_or_generate_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_or_generate_key(self):
        """
        Get encryption key from environment or generate a new one.
        
        Returns:
            bytes: Fernet encryption key
        """
        # Try to get key from environment variable
        key_b64 = os.getenv('ENCRYPTION_KEY')
        
        if key_b64:
            try:
                key = base64.urlsafe_b64decode(key_b64)
                # Validate it's a proper Fernet key
                Fernet(key)
                logger.info("Using encryption key from environment")
                return key
            except Exception as e:
                logger.warning(f"Invalid encryption key in environment: {e}")
        
        # Generate new key if none found or invalid
        key = Fernet.generate_key()
        key_b64 = base64.urlsafe_b64encode(key).decode()
        logger.warning(f"Generated new encryption key: {key_b64}")
        logger.warning("Please set ENCRYPTION_KEY environment variable for production!")
        return key
    
    def hash_password(self, password):
        """
        Hash a password using bcrypt.
        
        Args:
            password (str): Plain text password
            
        Returns:
            str: Hashed password (bcrypt format)
        """
        try:
            # Generate salt and hash password
            salt = bcrypt.gensalt(rounds=12)
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            logger.info("Password hashed successfully")
            return hashed.decode('utf-8')
        except Exception as e:
            logger.error(f"Password hashing failed: {e}")
            raise
    
    def verify_password(self, password, hashed_password):
        """
        Verify a password against its hash.
        
        Args:
            password (str): Plain text password to verify
            hashed_password (str): Stored hash to compare against
            
        Returns:
            bool: True if password matches, False otherwise
        """
        try:
            result = bcrypt.checkpw(
                password.encode('utf-8'), 
                hashed_password.encode('utf-8')
            )
            logger.info(f"Password verification: {'success' if result else 'failed'}")
            return result
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def encrypt_data(self, data):
        """
        Encrypt sensitive data.
        
        Args:
            data (str): Data to encrypt
            
        Returns:
            str: Base64 encoded encrypted data
        """
        try:
            encrypted_data = self.fernet.encrypt(data.encode('utf-8'))
            encoded_data = base64.b64encode(encrypted_data).decode('utf-8')
            logger.info("Data encrypted successfully")
            return encoded_data
        except Exception as e:
            logger.error(f"Data encryption failed: {e}")
            raise
    
    def decrypt_data(self, encrypted_data):
        """
        Decrypt sensitive data.
        
        Args:
            encrypted_data (str): Base64 encoded encrypted data
            
        Returns:
            str: Decrypted plain text data
        """
        try:
            decoded_data = base64.b64decode(encrypted_data.encode('utf-8'))
            decrypted_data = self.fernet.decrypt(decoded_data)
            logger.info("Data decrypted successfully")
            return decrypted_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Data decryption failed: {e}")
            raise
    
    def derive_key_from_password(self, password, salt=None):
        """
        Derive a key from a password using PBKDF2.
        
        Args:
            password (str): Password to derive key from
            salt (bytes, optional): Salt for key derivation
            
        Returns:
            tuple: (derived_key, salt_used)
        """
        try:
            if salt is None:
                salt = os.urandom(16)
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(password.encode('utf-8'))
            logger.info("Key derived from password successfully")
            return key, salt
        except Exception as e:
            logger.error(f"Key derivation failed: {e}")
            raise
    
    def secure_compare(self, a, b):
        """
        Securely compare two strings to prevent timing attacks.
        
        Args:
            a (str): First string
            b (str): Second string
            
        Returns:
            bool: True if strings are equal, False otherwise
        """
        if len(a) != len(b):
            return False
        
        result = 0
        for x, y in zip(a, b):
            result |= ord(x) ^ ord(y)
        
        return result == 0 