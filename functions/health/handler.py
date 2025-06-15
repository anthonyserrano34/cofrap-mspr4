"""
OpenFaaS Function: health
Simple health check function for COFRAP Authentication System connectivity testing.

Input: {} (empty JSON object or any JSON)
Output: {"status": "healthy", "message": "string", "timestamp": number, "success": boolean}
"""

import json
import time
import sys
import os

# Add shared utilities to path
sys.path.insert(0, '/home/app/function')
sys.path.insert(0, '/home/app')

try:
    from shared import ResponseUtils
except ImportError:
    # Fallback for local development
    import sys
    sys.path.append('../shared')
    from utils import ResponseUtils

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle(req):
    """
    OpenFaaS handler function for health check.
    
    Args:
        req (str or dict): Request data (can be empty)
        
    Returns:
        str: JSON response with health status
    """
    try:
        logger.info("Health check requested")
        
        # Parse input - handle both string and dict formats
        request_data = {}
        if req:
            if isinstance(req, str):
                try:
                    request_data = json.loads(req)
                except json.JSONDecodeError:
                    # If it's not valid JSON, treat as empty request
                    request_data = {}
            elif isinstance(req, dict):
                request_data = req
        
        # Get current timestamp
        current_timestamp = int(time.time())
        
        # Basic system information
        health_info = {
            "status": "healthy",
            "service": "COFRAP Authentication System",
            "version": "1.0.0",
            "timestamp": current_timestamp,
            "uptime_check": "OpenFaaS function responding",
            "database_required": True,
            "encryption_required": True,
            "components": {
                "openfaas": "✅ Running",
                "python_runtime": "✅ Available", 
                "shared_modules": "✅ Loaded"
            }
        }
        
        # Add optional client info if provided
        if request_data.get('client_info'):
            health_info['client_info'] = request_data['client_info']
        
        logger.info("Health check completed successfully")
        
        return json.dumps(ResponseUtils.success_response(
            health_info,
            "COFRAP Authentication System is healthy and ready"
        ))
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return json.dumps(ResponseUtils.error_response(
            "Health check failed",
            "HEALTH_CHECK_ERROR"
        ))

# For local testing
if __name__ == "__main__":
    # Test with empty request
    print("Testing health function:")
    print("Input: {}")
    result = handle("{}")
    print("Output:", result)
    
    # Test with client info
    test_request = json.dumps({"client_info": "Frontend connectivity test"})
    print("\nInput with client info:", test_request)
    result = handle(test_request)
    print("Output:", result) 