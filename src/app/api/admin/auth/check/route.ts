import { NextRequest, NextResponse } from 'next/server'
import { verifySecureJWT, SecurityLogger, secureAPI } from '@/lib/security'

export const GET = secureAPI(async (request: NextRequest) => {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    
    if (!token) {
      SecurityLogger.logAuthAttempt('unknown', false, request.headers.get('user-agent') || 'unknown')
      return NextResponse.json({ 
        authenticated: false,
        error: 'No token provided'
      })
    }

    try {
      const decoded = verifySecureJWT(token)
      
      SecurityLogger.logAuthAttempt(decoded.username, true, request.headers.get('user-agent') || 'unknown')
      
      return NextResponse.json({ 
        authenticated: true,
        user: { 
          username: decoded.username, 
          role: decoded.role 
        }
      })
    } catch (error: any) {
      SecurityLogger.logAuthAttempt('unknown', false, request.headers.get('user-agent') || 'unknown')
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid token'
      })
    }
  } catch (error: any) {
    SecurityLogger.log('error', 'auth_check_error', { 
      error: error.message,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    return NextResponse.json({ 
      authenticated: false,
      error: 'Server error'
    })
  }
})
