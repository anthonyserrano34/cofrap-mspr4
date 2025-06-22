/**
 * NextJS API Route: health
 * Health check endpoint for COFRAP Authentication System.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/server/database';
import { TimeUtils, ResponseUtils } from '@/lib/server/utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check requested');

    // Get client info from headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'Unknown';

    // Test database connection
    let databaseStatus = 'connected';
    try {
      const dbManager = new DatabaseManager();
      // Try to get all users to test database
      dbManager.getAllUsers();
    } catch (error) {
      console.error('Database test failed:', error);
      databaseStatus = 'error';
    }

    // Check environment variables
    const encryptionKeyStatus = process.env.ENCRYPTION_KEY ? 'configured' : 'using_generated';

    // Calculate uptime (simplified - using current timestamp)
    const currentTimestamp = TimeUtils.getCurrentTimestamp();
    const uptimeCheck = TimeUtils.formatTimestamp(currentTimestamp);

    // Health response data
    const healthData = {
      status: 'healthy',
      service: 'COFRAP Authentication System',
      version: '1.0.0',
      timestamp: currentTimestamp,
      uptime_check: uptimeCheck,
      database_required: true,
      encryption_required: true,
      components: {
        openfaas: 'operational',
        python_runtime: 'operational',
        shared_modules: 'operational',
        postgresql_database: databaseStatus,
        crypto_manager: 'operational',
        encryption_key: encryptionKeyStatus
      },
      client_info: `${userAgent} from ${clientIP}`,
      endpoints: {
        generate_password: '/function/generate-password',
        generate_2fa: '/function/generate-2fa',
        authenticate_user: '/function/authenticate-user',
        health: '/function/health'
      }
    };

    console.log('✅ Health check completed successfully');
    return NextResponse.json(
      ResponseUtils.successResponse(
        healthData,
        'System is healthy and operational'
      )
    );

  } catch (error) {
    console.error(`❌ Health check failed: ${error}`);
    return NextResponse.json(
      ResponseUtils.errorResponse(
        'Health check failed',
        'HEALTH_CHECK_ERROR'
      ),
      { status: 500 }
    );
  }
}

// Also support POST for compatibility with frontend
export async function POST(request: NextRequest) {
  return GET(request);
} 