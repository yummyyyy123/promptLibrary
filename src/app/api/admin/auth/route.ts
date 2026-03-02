import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken } from '@/lib/admin-auth'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'root'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'r00t'

// Simple rate limiting in-memory store
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 minutes
    return true
  }
  
  if (attempts.count >= 5) {
    return false // Rate limited
  }
  
  attempts.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt received')
    
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limiting
    if (!checkRateLimit(ip)) {
      console.warn(`🚨 Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Too many login attempts, please try again later',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { username, password } = body
    console.log('👤 Username:', username)
    console.log('🔑 Password provided:', password ? 'YES' : 'NO')
    console.log('🎯 Expected username:', ADMIN_USERNAME)
    console.log('🎯 Expected password:', ADMIN_PASSWORD ? 'SET' : 'NOT SET')

    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.warn(`🚨 Failed login attempt for username: ${username} from IP: ${ip}`)
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Generate token using our secure function
    const authResult = generateAdminToken(username, password)
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          error: 'Token generation failed',
          message: authResult.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log(`✅ Successful admin login for: ${username} from IP: ${ip}`)
    
    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token: authResult.token, // Also return token for client-side storage
      timestamp: new Date().toISOString()
    })
    
    // Set HTTP-only secure cookie
    response.cookies.set('admin-token', authResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response

  } catch (error: any) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: 'Login failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🚪 Logout request received')
    
    // Clear the authentication cookie
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0 // Immediately expire the cookie
    })

    console.log('🍪 Cookie cleared for logout')
    return response

  } catch (error: any) {
    console.error('💥 Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
