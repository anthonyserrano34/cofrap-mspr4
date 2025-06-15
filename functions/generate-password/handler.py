"""
OpenFaaS Function: generate-password
Generates secure passwords with QR codes for COFRAP Authentication System.

Input: {"username": "string"}
Output: {"password": "string", "qrcode_base64": "string", "success": boolean}
"""

import json
import sys
import os

# Add shared utilities to path
sys.path.insert(0, '/home/app/function')
sys.path.insert(0, '/home/app')

try:
    from shared import (
        DatabaseManager, 
        CryptoManager, 
        PasswordGenerator, 
        QRCodeGenerator, 
        TimeUtils, 
        ResponseUtils
    )
except ImportError:
    # Fallback for local development
    import sys
    sys.path.append('../shared')
    from database import DatabaseManager
    from crypto import CryptoManager
    from utils import PasswordGenerator, QRCodeGenerator, TimeUtils, ResponseUtils

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle(req):
    """
    OpenFaaS handler function for password generation.
    
    Args:
        req (str): JSON string containing username
        
    Returns:
        str: JSON response with password and QR code
    """
    try:
        # Parse input
        if not req:
            return json.dumps(ResponseUtils.error_response(
                "Request body is required", 
                "MISSING_REQUEST_BODY"
            ))
        
        # Handle both string
        if isinstance(req, str):
            try:
                request_data = json.loads(req)
            except json.JSONDecodeError:
                return json.dumps(ResponseUtils.error_response(
                    "Invalid JSON format", 
                    "INVALID_JSON"
                ))
        elif isinstance(req, dict):
            request_data = req
        else:
            return json.dumps(ResponseUtils.error_response(
                "Invalid request format", 
                "INVALID_REQUEST_FORMAT"
            ))
        
        # Validate required fields
        username = request_data.get('username')
        if not username:
            return json.dumps(ResponseUtils.error_response(
                "Username is required", 
                "MISSING_USERNAME"
            ))
        
        # Validate username format
        if not isinstance(username, str) or len(username.strip()) == 0:
            return json.dumps(ResponseUtils.error_response(
                "Username must be a non-empty string", 
                "INVALID_USERNAME"
            ))
        
        username = username.strip().lower()
        
        # Validate username length and characters
        if len(username) < 3 or len(username) > 50:
            return json.dumps(ResponseUtils.error_response(
                "Username must be between 3 and 50 characters", 
                "INVALID_USERNAME_LENGTH"
            ))
        
        # Generate password
        logger.info(f"Generating password for user: {username}")
        password = PasswordGenerator.generate_complex_password(24)
        
        # Validate generated password (should always pass, but safety check)
        is_valid, errors = PasswordGenerator.validate_password_complexity(password)
        if not is_valid:
            logger.error(f"Generated password failed validation: {errors}")
            return json.dumps(ResponseUtils.error_response(
                "Password generation failed validation", 
                "PASSWORD_GENERATION_ERROR"
            ))
        
        # Generate QR code for the password
        logger.info(f"Generating QR code for password")
        try:
            qr_data = f"COFRAP Password for {username}: {password}"
            qrcode_base64 = QRCodeGenerator.generate_qr_code(
                qr_data, 
                f"COFRAP Password - {username}"
            )
        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "QR code generation failed", 
                "QRCODE_GENERATION_ERROR"
            ))
        
        # Initialize crypto and database managers
        crypto_manager = CryptoManager()
        db_manager = DatabaseManager()
        
        # Hash the password
        try:
            password_hash = crypto_manager.hash_password(password)
        except Exception as e:
            logger.error(f"Password hashing failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "Password hashing failed", 
                "PASSWORD_HASHING_ERROR"
            ))
        
        # Generate placeholder MFA secret (will be updated by generate-2fa function)
        # This is needed because the database schema requires mfa_secret
        placeholder_mfa = crypto_manager.encrypt_data("PLACEHOLDER_MFA_SECRET")
        
        # Get current timestamp
        current_timestamp = TimeUtils.get_current_timestamp()
        
        # Store in database
        try:
            # Ensure database table exists
            db_manager.create_user_table()
            
            # Insert/update user with new password
            success = db_manager.insert_user(
                username=username,
                password_hash=password_hash,
                mfa_secret=placeholder_mfa,
                gendate=current_timestamp
            )
            
            if not success:
                return json.dumps(ResponseUtils.error_response(
                    "Failed to store user credentials", 
                    "DATABASE_ERROR"
                ))
            
        except Exception as e:
            logger.error(f"Database operation failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "Database operation failed", 
                "DATABASE_ERROR"
            ))
        
        # Return success response
        logger.info(f"Password generated successfully for user: {username}")
        return json.dumps(ResponseUtils.success_response({
            "password": password,
            "qrcode_base64": qrcode_base64,
            "username": username,
            "generated_at": TimeUtils.format_timestamp(current_timestamp)
        }, f"Password generated successfully for user {username}"))
        
    except Exception as e:
        logger.error(f"Unexpected error in generate-password function: {e}")
        return json.dumps(ResponseUtils.error_response(
            "Internal server error", 
            "INTERNAL_ERROR"
        ))

# For local testing
if __name__ == "__main__":
    # Test with sample data
    test_request = json.dumps({"username": "test.user"})
    print("Testing generate-password function:")
    print("Input:", test_request)
    result = handle(test_request)
    print("Output:", result) 