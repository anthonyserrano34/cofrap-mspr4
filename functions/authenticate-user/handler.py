"""
OpenFaaS Function: authenticate-user
Authenticates users with password and TOTP code, checking for expiration.

Input: {"username": "string", "password": "string", "totp_code": "string"}
Output: {"authenticated": boolean, "expired": boolean, "message": "string"}
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
        TimeUtils, 
        ResponseUtils
    )
except ImportError:
    # Fallback for local development
    import sys
    sys.path.append('../shared')
    from database import DatabaseManager
    from crypto import CryptoManager
    from utils import TOTPManager, TimeUtils, ResponseUtils

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle(req):
    """
    OpenFaaS handler function for user authentication.
    
    Args:
        req (str): JSON string containing username, password, and totp_code
        
    Returns:
        str: JSON response with authentication result
    """
    try:
        # Parse input - handle both string and dict formats
        if not req:
            return json.dumps(ResponseUtils.error_response(
                "Request body is required", 
                "MISSING_REQUEST_BODY"
            ))
        
        # Handle both string (raw JSON) and dict (already parsed) inputs
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
        password = request_data.get('password')
        totp_code = request_data.get('totp_code')
        
        if not username:
            return json.dumps(ResponseUtils.error_response(
                "Username is required", 
                "MISSING_USERNAME"
            ))
        
        if not password:
            return json.dumps(ResponseUtils.error_response(
                "Password is required", 
                "MISSING_PASSWORD"
            ))
        
        if not totp_code:
            return json.dumps(ResponseUtils.error_response(
                "TOTP code is required", 
                "MISSING_TOTP_CODE"
            ))
        
        # Validate input formats
        if not isinstance(username, str) or len(username.strip()) == 0:
            return json.dumps(ResponseUtils.error_response(
                "Username must be a non-empty string", 
                "INVALID_USERNAME"
            ))
        
        if not isinstance(password, str) or len(password) == 0:
            return json.dumps(ResponseUtils.error_response(
                "Password must be a non-empty string", 
                "INVALID_PASSWORD"
            ))
        
        if not isinstance(totp_code, str) or len(totp_code) != 6 or not totp_code.isdigit():
            return json.dumps(ResponseUtils.error_response(
                "TOTP code must be a 6-digit string", 
                "INVALID_TOTP_CODE"
            ))
        
        username = username.strip().lower()
        
        # Initialize managers
        crypto_manager = CryptoManager()
        db_manager = DatabaseManager()
        
        # Get user from database
        try:
            user = db_manager.get_user(username)
            if not user:
                logger.warning(f"Authentication failed - user not found: {username}")
                return json.dumps({
                    "authenticated": False,
                    "expired": False,
                    "message": "Invalid credentials",
                    "success": False,
                    "timestamp": TimeUtils.get_current_timestamp()
                })
        except Exception as e:
            logger.error(f"Database error retrieving user: {e}")
            return json.dumps(ResponseUtils.error_response(
                "Database error occurred", 
                "DATABASE_ERROR"
            ))
        
        # Check if account is already marked as expired
        if user.get('expired', False):
            logger.info(f"User {username} account is marked as expired")
            return json.dumps({
                "authenticated": False,
                "expired": True,
                "message": "Account expired. Please regenerate credentials.",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        # Check if credentials are expired (6 months)
        user_gendate = user.get('gendate', 0)
        if TimeUtils.is_expired(user_gendate, max_age_months=6):
            logger.info(f"User {username} credentials expired based on gendate")
            
            # Mark user as expired in database
            try:
                db_manager.mark_user_expired(username)
            except Exception as e:
                logger.error(f"Failed to mark user as expired: {e}")
            
            return json.dumps({
                "authenticated": False,
                "expired": True,
                "message": "Credentials expired (6 months). Please regenerate credentials.",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp(),
                "expired_since": TimeUtils.format_timestamp(user_gendate)
            })
        
        # Verify password
        stored_password_hash = user.get('password_hash')
        if not stored_password_hash:
            logger.error(f"No password hash found for user: {username}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "Invalid credentials",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        try:
            password_valid = crypto_manager.verify_password(password, stored_password_hash)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "Authentication error",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        if not password_valid:
            logger.warning(f"Authentication failed - invalid password for user: {username}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "Invalid credentials",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        # Decrypt and verify TOTP code
        stored_mfa_secret = user.get('mfa_secret')
        if not stored_mfa_secret:
            logger.error(f"No MFA secret found for user: {username}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "MFA not configured. Please generate 2FA first.",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        # Skip verification if it's a placeholder MFA secret
        if stored_mfa_secret and "PLACEHOLDER_MFA_SECRET" in stored_mfa_secret:
            logger.warning(f"User {username} has placeholder MFA secret")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "2FA not configured. Please generate 2FA secret first.",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        try:
            # Decrypt the TOTP secret
            totp_secret = crypto_manager.decrypt_data(stored_mfa_secret)
        except Exception as e:
            logger.error(f"Failed to decrypt TOTP secret for user {username}: {e}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "Authentication error - corrupted 2FA data",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        try:
            # Verify TOTP code
            totp_valid = TOTPManager.verify_totp_code(totp_secret, totp_code, window=1)
        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "TOTP verification error",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        if not totp_valid:
            logger.warning(f"Authentication failed - invalid TOTP code for user: {username}")
            return json.dumps({
                "authenticated": False,
                "expired": False,
                "message": "Invalid TOTP code",
                "success": False,
                "timestamp": TimeUtils.get_current_timestamp()
            })
        
        # Authentication successful
        logger.info(f"Authentication successful for user: {username}")
        return json.dumps({
            "authenticated": True,
            "expired": False,
            "message": f"Authentication successful for user {username}",
            "success": True,
            "username": username,
            "timestamp": TimeUtils.get_current_timestamp(),
            "credentials_age_days": (TimeUtils.get_current_timestamp() - user_gendate) // (24 * 60 * 60)
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in authenticate-user function: {e}")
        return json.dumps(ResponseUtils.error_response(
            "Internal server error", 
            "INTERNAL_ERROR"
        ))

# For local testing
if __name__ == "__main__":
    # Test with sample data
    test_request = json.dumps({
        "username": "test.user",
        "password": "testpassword123",
        "totp_code": "123456"
    })
    print("Testing authenticate-user function:")
    print("Input:", test_request)
    result = handle(test_request)
    print("Output:", result) 