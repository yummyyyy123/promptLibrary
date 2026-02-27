// SMS OTP API - Send and verify OTP codes
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { SMSOTP, OTPSession } from '@/lib/smsOTP'

export async function POST(request: NextRequest) {
  try {
    const { phone, action } = await request.json()
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Validate phone number format (Philippines format)
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Use 09XXXXXXXX format.' }, { status: 400 })
    }

    if (action === 'send') {
      // Generate and send OTP
      const otp = SMSOTP.generateOTP()
      
      // Send OTP via SMS
      const smsSent = await SMSOTP.sendOTP(phone, otp)
      
      if (!smsSent) {
        return NextResponse.json({ error: 'Failed to send SMS. Please try again.' }, { status: 500 })
      }

      // Store OTP in database
      const stored = await SMSOTP.storeOTP(phone, otp)
      
      if (!stored) {
        return NextResponse.json({ error: 'Failed to store OTP. Please try again.' }, { status: 500 })
      }

      // Create temporary session
      const tempToken = OTPSession.createTempSession(phone)

      return NextResponse.json({
        message: 'OTP sent successfully',
        tempToken,
        phoneLastFour: phone.slice(-4), // Only send last 4 digits for security
        expiresIn: 300 // 5 minutes
      })

    } else if (action === 'verify') {
      const { otp, tempToken } = await request.json()

      if (!otp || !tempToken) {
        return NextResponse.json({ error: 'OTP and temporary token required' }, { status: 400 })
      }

      // Verify OTP
      const isValid = await SMSOTP.verifyOTP(phone, otp)
      
      if (!isValid) {
        // Increment failed attempts
        await SMSOTP.incrementAttempts(phone)
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 })
      }

      // Complete OTP verification
      const permanentToken = OTPSession.completeOTP(tempToken)
      
      if (!permanentToken) {
        return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 400 })
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          phone: phone.slice(-4), // Only store last 4 digits
          role: 'admin',
          otpVerified: true
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      const response = NextResponse.json({
        message: 'OTP verified successfully',
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
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('SMS OTP error:', error)
    return NextResponse.json({ error: 'Failed to process OTP request' }, { status: 500 })
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
      requiresOTP: !decoded.otpVerified,
      phoneLastFour: decoded.phone || null
    })

  } catch (error: any) {
    return NextResponse.json({ 
      authenticated: false,
      requiresOTP: false
    })
  }
}
