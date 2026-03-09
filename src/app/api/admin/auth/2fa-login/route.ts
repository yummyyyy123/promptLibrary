// Fix 2FA - Always require OTP for admin login
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { EmailOTP, OTPSession } from '@/lib/emailOTP'

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers and handle host validation
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''

    console.log(`🌐 Request headers: origin=${origin}, host=${host}`)

    const { username, email, action, otp, tempToken } = await request.json()
    const JWT_SECRET = process.env.JWT_SECRET ?? ''
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? ''
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

    // Reject immediately if required env vars are not configured
    if (!JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('🚨 Missing required auth environment variables')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    console.log(`📝 Request data: action=${action}, username=${username}, email=${email}`)

    if (action === 'verify-otp') {
      // Step 2: Verify OTP
      if (!otp || !tempToken) {
        return NextResponse.json({
          error: 'OTP and temporary token required'
        }, { status: 400 })
      }

      // Retrieve email from temporary session if not provided
      let effectiveEmail = email
      if (!effectiveEmail) {
        effectiveEmail = OTPSession.verifyTempSession(tempToken) || process.env.ADMIN_EMAIL
      }

      if (!effectiveEmail) {
        return NextResponse.json({
          error: 'Session invalid or expired'
        }, { status: 400 })
      }

      // Verify OTP — strictly validate against stored OTP only
      let isValid = false

      try {
        isValid = await EmailOTP.verifyOTP(effectiveEmail, otp)
      } catch (error) {
        // Database unavailable — cannot verify OTP safely, reject
        console.error('⚠️ Database error during OTP verification:', error)
        return NextResponse.json({
          error: 'Verification service unavailable. Please try again.'
        }, { status: 503 })
      }

      if (!isValid) {
        // Increment failed attempts
        try {
          await EmailOTP.incrementAttempts(effectiveEmail)
        } catch (error) {
          console.log('⚠️ Could not increment attempts (database not ready)')
        }
        return NextResponse.json({
          error: 'Invalid OTP. Please try again.'
        }, { status: 400 })
      }

      // Complete OTP verification
      const permanentToken = OTPSession.completeOTP(tempToken)

      if (!permanentToken) {
        return NextResponse.json({
          error: 'Session expired. Please try again.'
        }, { status: 400 })
      }

      // Create JWT token with 2FA verified
      const token = jwt.sign(
        {
          username: username || ADMIN_USERNAME,
          role: 'admin',
          twoFactorVerified: true,
          email: effectiveEmail.slice(-4) // Only store last 4 digits
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      const response = NextResponse.json({
        message: '2FA verification successful',
        requiresOTP: false,
        token
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })

      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600 // 1 hour
      })

      return response

    } else {
      return NextResponse.json({
        error: 'Invalid action'
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('2FA login error:', error)
    return NextResponse.json({
      error: 'Login failed'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET ?? ''

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        requiresOTP: false
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    return NextResponse.json({
      authenticated: true,
      requiresOTP: !decoded.twoFactorVerified,
      emailLastFour: decoded.email || null
    })

  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      requiresOTP: false
    })
  }
}
