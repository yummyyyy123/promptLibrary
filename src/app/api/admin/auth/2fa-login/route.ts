// 2FA Login API - Password first, then OTP
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { SMSOTP, OTPSession } from '@/lib/smsOTP'

export async function POST(request: NextRequest) {
  try {
    const { username, password, phone, action, otp, tempToken } = await request.json()
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

    if (action === 'password') {
      // Step 1: Verify username and password
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return NextResponse.json({ 
          error: 'Invalid credentials' 
        }, { status: 401 })
      }

      // Check if 2FA is enabled for this admin
      const has2FA = await SMSOTP.isPhoneRegistered(phone)
      
      if (!has2FA) {
        // No 2FA enabled, create normal JWT
        const token = jwt.sign(
          { username, role: 'admin', twoFactorVerified: false },
          JWT_SECRET,
          { expiresIn: '1h' }
        )

        const response = NextResponse.json({
          message: 'Login successful',
          requiresOTP: false,
          token
        })

        response.cookies.set('admin-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600 // 1 hour
        })

        return response
      }

      // 2FA enabled, create temporary session and send OTP
      const otpCode = SMSOTP.generateOTP()
      
      // Send OTP via SMS
      const smsSent = await SMSOTP.sendOTP(phone, otpCode)
      
      if (!smsSent) {
        return NextResponse.json({ 
          error: 'Failed to send OTP. Please try again.' 
        }, { status: 500 })
      }

      // Store OTP in database
      const stored = await SMSOTP.storeOTP(phone, otpCode)
      
      if (!stored) {
        return NextResponse.json({ 
          error: 'Failed to store OTP. Please try again.' 
        }, { status: 500 })
      }

      // Create temporary session
      const tempToken = OTPSession.createTempSession(phone)

      return NextResponse.json({
        message: 'Password verified. OTP sent to your phone.',
        requiresOTP: true,
        tempToken,
        phoneLastFour: phone.slice(-4),
        expiresIn: 300 // 5 minutes
      })

    } else if (action === 'verify-otp') {
      // Step 2: Verify OTP
      if (!otp || !tempToken) {
        return NextResponse.json({ 
          error: 'OTP and temporary token required' 
        }, { status: 400 })
      }

      // Verify OTP
      const isValid = await SMSOTP.verifyOTP(phone, otp)
      
      if (!isValid) {
        // Increment failed attempts
        await SMSOTP.incrementAttempts(phone)
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
          username,
          role: 'admin',
          twoFactorVerified: true,
          phone: phone.slice(-4) // Only store last 4 digits
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      const response = NextResponse.json({
        message: '2FA verification successful',
        requiresOTP: false,
        token
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
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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
      phoneLastFour: decoded.phone || null
    })

  } catch (error: any) {
    return NextResponse.json({ 
      authenticated: false,
      requiresOTP: false
    })
  }
}
