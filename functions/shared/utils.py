"""
Utility functions for COFRAP Authentication System
Handles password generation, QR code creation, TOTP operations, and common utilities.
"""

import os
import time
import random
import string
import base64
import io
import pyotp
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PasswordGenerator:
    """Generates secure passwords according to COFRAP requirements."""
    
    @staticmethod
    def generate_complex_password(length=24):
        """
        Generate a complex password with specified requirements.
        
        Requirements:
        - 24 characters minimum
        - Must contain uppercase, lowercase, digits, and special characters
        
        Args:
            length (int): Password length (default: 24)
            
        Returns:
            str: Generated complex password
        """
        if length < 24:
            raise ValueError("Password length must be at least 24 characters")
        
        # Define character sets
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        # Ensure at least one character from each category
        password_chars = [
            random.choice(uppercase),
            random.choice(lowercase), 
            random.choice(digits),
            random.choice(special_chars)
        ]
        
        # Fill remaining positions with random choices from all sets
        all_chars = uppercase + lowercase + digits + special_chars
        for _ in range(length - 4):
            password_chars.append(random.choice(all_chars))
        
        # Shuffle the password to avoid predictable patterns
        random.shuffle(password_chars)
        
        password = ''.join(password_chars)
        logger.info(f"Generated complex password of length {length}")
        return password
    
    @staticmethod
    def validate_password_complexity(password):
        """
        Validate if password meets complexity requirements.
        
        Args:
            password (str): Password to validate
            
        Returns:
            tuple: (is_valid, error_messages)
        """
        errors = []
        
        if len(password) < 24:
            errors.append("Password must be at least 24 characters long")
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one digit")
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            errors.append("Password must contain at least one special character")
        
        is_valid = len(errors) == 0
        return is_valid, errors

class QRCodeGenerator:
    """Generates QR codes for passwords and TOTP secrets."""
    
    @staticmethod
    def generate_qr_code(data, title="COFRAP Auth"):
        """
        Generate a QR code image from data.
        
        Args:
            data (str): Data to encode in QR code
            title (str): Title for the QR code
            
        Returns:
            str: Base64 encoded PNG image of the QR code
        """
        try:
            # Create QR code instance
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # Add data and optimize
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create image with styling
            img = qr.make_image(
                fill_color="black",
                back_color="white",
                image_factory=StyledPilImage,
                module_drawer=RoundedModuleDrawer()
            )
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            logger.info(f"QR code generated successfully for {title}")
            return qr_base64
            
        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            raise

class TOTPManager:
    """Manages TOTP (Time-based One-Time Password) operations."""
    
    @staticmethod
    def generate_secret():
        """
        Generate a new TOTP secret.
        
        Returns:
            str: Base32 encoded TOTP secret
        """
        try:
            secret = pyotp.random_base32()
            logger.info("TOTP secret generated successfully")
            return secret
        except Exception as e:
            logger.error(f"TOTP secret generation failed: {e}")
            raise
    
    @staticmethod
    def generate_totp_uri(secret, username, issuer="COFRAP"):
        """
        Generate TOTP URI for authenticator apps.
        
        Args:
            secret (str): Base32 TOTP secret
            username (str): Username for the account
            issuer (str): Issuer name (default: COFRAP)
            
        Returns:
            str: TOTP URI compatible with Google Authenticator
        """
        try:
            totp = pyotp.TOTP(secret)
            uri = totp.provisioning_uri(
                name=username,
                issuer_name=issuer
            )
            logger.info(f"TOTP URI generated for user {username}")
            return uri
        except Exception as e:
            logger.error(f"TOTP URI generation failed: {e}")
            raise
    
    @staticmethod
    def verify_totp_code(secret, code, window=1):
        """
        Verify a TOTP code against the secret.
        
        Args:
            secret (str): Base32 TOTP secret
            code (str): 6-digit TOTP code to verify
            window (int): Time window tolerance (default: 1 = ±30 seconds)
            
        Returns:
            bool: True if code is valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret)
            is_valid = totp.verify(code, valid_window=window)
            logger.info(f"TOTP verification: {'success' if is_valid else 'failed'}")
            return is_valid
        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return False
    
    @staticmethod
    def get_current_totp_code(secret):
        """
        Get the current TOTP code for testing purposes.
        
        Args:
            secret (str): Base32 TOTP secret
            
        Returns:
            str: Current 6-digit TOTP code
        """
        try:
            totp = pyotp.TOTP(secret)
            code = totp.now()
            logger.info("Current TOTP code generated")
            return code
        except Exception as e:
            logger.error(f"Current TOTP code generation failed: {e}")
            raise

class TimeUtils:
    """Time-related utility functions."""
    
    @staticmethod
    def get_current_timestamp():
        """
        Get current Unix timestamp.
        
        Returns:
            int: Current Unix timestamp
        """
        return int(time.time())
    
    @staticmethod
    def is_expired(timestamp, max_age_months=6):
        """
        Check if a timestamp is older than specified months.
        
        Args:
            timestamp (int): Unix timestamp to check
            max_age_months (int): Maximum age in months (default: 6)
            
        Returns:
            bool: True if expired, False otherwise
        """
        current_time = int(time.time())
        max_age_seconds = max_age_months * 30 * 24 * 60 * 60  # Approximate months to seconds
        age = current_time - timestamp
        
        is_old = age > max_age_seconds
        logger.info(f"Timestamp age check: {age} seconds ({'expired' if is_old else 'valid'})")
        return is_old
    
    @staticmethod
    def format_timestamp(timestamp):
        """
        Format Unix timestamp to human-readable string.
        
        Args:
            timestamp (int): Unix timestamp
            
        Returns:
            str: Formatted date string
        """
        try:
            import datetime
            dt = datetime.datetime.fromtimestamp(timestamp)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception as e:
            logger.error(f"Timestamp formatting failed: {e}")
            return "Invalid timestamp"

class ResponseUtils:
    """Utility functions for formatting API responses."""
    
    @staticmethod
    def success_response(data=None, message="Operation successful"):
        """
        Create a standardized success response.
        
        Args:
            data (dict, optional): Response data
            message (str): Success message
            
        Returns:
            dict: Standardized success response
        """
        response = {
            "success": True,
            "message": message,
            "timestamp": TimeUtils.get_current_timestamp()
        }
        
        if data:
            response.update(data)
        
        return response
    
    @staticmethod
    def error_response(message="Operation failed", error_code=None):
        """
        Create a standardized error response.
        
        Args:
            message (str): Error message
            error_code (str, optional): Error code
            
        Returns:
            dict: Standardized error response
        """
        response = {
            "success": False,
            "message": message,
            "timestamp": TimeUtils.get_current_timestamp()
        }
        
        if error_code:
            response["error_code"] = error_code
        
        return response
    
    @staticmethod
    def validation_error_response(errors):
        """
        Create a validation error response.
        
        Args:
            errors (list): List of validation error messages
            
        Returns:
            dict: Standardized validation error response
        """
        return {
            "success": False,
            "message": "Validation failed",
            "errors": errors,
            "timestamp": TimeUtils.get_current_timestamp()
        } 