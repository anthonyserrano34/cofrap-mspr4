"""
OpenFaaS Function: generate-2fa
Generates TOTP secrets with QR codes for COFRAP Authentication System.

Input: {"username": "string"}
Output: {"totp_uri": "string", "qrcode_base64": "string", "success": boolean}
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
        TOTPManager, 
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
    from utils import TOTPManager, QRCodeGenerator, TimeUtils, ResponseUtils

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle(req):
    """
    OpenFaaS handler function for TOTP/2FA generation.
    
    Args:
        req (str): JSON string containing username
        
    Returns:
        str: JSON response with TOTP URI and QR code
    """
    try:
        # Parse input
        if not req:
            return json.dumps(ResponseUtils.error_response(
                "Request body is required", 
                "MISSING_REQUEST_BODY"
            ))
        
        try:
            request_data = json.loads(req)
        except json.JSONDecodeError:
            return json.dumps(ResponseUtils.error_response(
                "Invalid JSON format", 
                "INVALID_JSON"
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
        
        # Initialize managers
        crypto_manager = CryptoManager()
        db_manager = DatabaseManager()
        
        # Check if user exists in database
        try:
            user = db_manager.get_user(username)
            if not user:
                return json.dumps(ResponseUtils.error_response(
                    f"User {username} not found. Please generate password first.", 
                    "USER_NOT_FOUND"
                ))
        except Exception as e:
            logger.error(f"Database error checking user: {e}")
            return json.dumps(ResponseUtils.error_response(
                "Database error occurred", 
                "DATABASE_ERROR"
            ))
        
        # Generate TOTP secret
        logger.info(f"Generating TOTP secret for user: {username}")
        try:
            totp_secret = TOTPManager.generate_secret()
        except Exception as e:
            logger.error(f"TOTP secret generation failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "TOTP secret generation failed", 
                "TOTP_GENERATION_ERROR"
            ))
        
        # Generate TOTP URI for authenticator apps
        logger.info(f"Generating TOTP URI for user: {username}")
        try:
            totp_uri = TOTPManager.generate_totp_uri(
                secret=totp_secret,
                username=username,
                issuer="COFRAP Auth System"
            )
        except Exception as e:
            logger.error(f"TOTP URI generation failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "TOTP URI generation failed", 
                "TOTP_URI_ERROR"
            ))
        
        # Generate QR code for the TOTP URI
        logger.info(f"Generating QR code for TOTP")
        try:
            qrcode_base64 = QRCodeGenerator.generate_qr_code(
                totp_uri, 
                f"COFRAP 2FA - {username}"
            )
        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "QR code generation failed", 
                "QRCODE_GENERATION_ERROR"
            ))
        
        # Encrypt the TOTP secret before storing
        try:
            encrypted_secret = crypto_manager.encrypt_data(totp_secret)
        except Exception as e:
            logger.error(f"TOTP secret encryption failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "TOTP secret encryption failed", 
                "ENCRYPTION_ERROR"
            ))
        
        # Get current timestamp
        current_timestamp = TimeUtils.get_current_timestamp()
        
        # Update user's MFA secret in database
        try:
            success = db_manager.update_user_mfa(
                username=username,
                mfa_secret=encrypted_secret,
                gendate=current_timestamp
            )
            
            if not success:
                return json.dumps(ResponseUtils.error_response(
                    "Failed to store TOTP secret", 
                    "DATABASE_UPDATE_ERROR"
                ))
            
        except Exception as e:
            logger.error(f"Database update failed: {e}")
            return json.dumps(ResponseUtils.error_response(
                "Database update failed", 
                "DATABASE_ERROR"
            ))
        
        # Return success response
        logger.info(f"TOTP secret generated successfully for user: {username}")
        return json.dumps(ResponseUtils.success_response({
            "totp_uri": totp_uri,
            "qrcode_base64": qrcode_base64,
            "username": username,
            "secret_length": len(totp_secret),
            "generated_at": TimeUtils.format_timestamp(current_timestamp),
            "instructions": "Scan this QR code with Google Authenticator, Authy, or similar TOTP app"
        }, f"TOTP secret generated successfully for user {username}"))
        
    except Exception as e:
        logger.error(f"Unexpected error in generate-2fa function: {e}")
        return json.dumps(ResponseUtils.error_response(
            "Internal server error", 
            "INTERNAL_ERROR"
        ))

# For local testing
if __name__ == "__main__":
    # Test with sample data
    test_request = json.dumps({"username": "test.user"})
    print("Testing generate-2fa function:")
    print("Input:", test_request)
    result = handle(test_request)
    print("Output:", result) 