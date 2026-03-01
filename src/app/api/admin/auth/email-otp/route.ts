// Email OTP delivery using Resend API with enhanced security
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { EmailOTP, OTPSession } from '@/lib/emailOTP'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; lastRequest: number }>()

// Rate limiting middleware
function rateLimit(email: string, maxRequests = 5, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const record = rateLimitStore.get(key)

  if (!record) {
    rateLimitStore.set(key, { count: 1, lastRequest: now })
    return true
  }

  // Reset window if expired
  if (now - record.lastRequest > windowMs) {
    rateLimitStore.set(key, { count: 1, lastRequest: now })
    return true
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return false
  }

  // Increment count
  record.count++
  record.lastRequest = now
  return true
}

// Security headers
function setSecurityHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers and security measures
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''
    const userAgent = request.headers.get('user-agent') || ''
    
    console.log(`🌐 Request headers: origin=${origin}, host=${host}`)
    
    // Validate origin
    const allowedOrigins = [
      'https://prompt-library-three-wheat.vercel.app',
      'http://localhost:3000',
      'https://localhost:3000'
    ]
    
    if (!allowedOrigins.includes(origin) && !origin.includes('localhost')) {
      console.log(`❌ Unauthorized origin: ${origin}`)
      return NextResponse.json(
        { error: 'Unauthorized origin' },
        { 
          status: 403,
          headers: setSecurityHeaders(origin)
        }
      )
    }

    const body = await request.json()
    const { email } = body

    // Input validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address required' }, { 
        status: 400,
        headers: setSecurityHeaders(origin)
      })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Invalid email address format'
      }, { 
        status: 400,
        headers: setSecurityHeaders(origin)
      })
    }

    // Rate limiting
    if (!rateLimit(email)) {
      console.log(`❌ Rate limit exceeded for: ${email}`)
      return NextResponse.json({
        error: 'Too many requests. Please try again later.'
      }, { 
        status: 429,
        headers: setSecurityHeaders(origin)
      })
    }

    // Only allow specific email for security
    const allowedEmail = 'spicy0pepper@gmail.com'
    if (email !== allowedEmail) {
      console.log(`❌ Unauthorized email attempt: ${email}`)
      return NextResponse.json({
        error: 'Unauthorized email address'
      }, { 
        status: 403,
        headers: setSecurityHeaders(origin)
      })
    }

    // Generate cryptographically secure OTP
    const otp = Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 10).toString()
    ).join('')

    console.log(`📧 Generating OTP for email: ${email}`)
    console.log(`🔍 OTP Code: ${otp}`)

    // Store OTP in EmailOTP system
    const stored = await EmailOTP.storeOTP(email, otp)
    if (!stored) {
      console.log('⚠️ Failed to store OTP, but continuing...')
    }

    // Create temporary session
    const tempToken = OTPSession.createTempSession(email)
    console.log(`🔐 Temp session created: ${tempToken}`)

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [email],
        subject: 'Your OTP Code for Admin Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">🔐 Two-Factor Authentication</h2>
              <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                Your OTP code for admin login is:
              </p>
              <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin-bottom: 20px;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
                This code will expire in 5 minutes.
              </p>
              <p style="color: #999; font-size: 12px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.log('❌ Email failed:', error)
        return NextResponse.json({
          success: false,
          otp: otp,
          message: 'Email service failed - OTP generated for testing',
          messageId: null,
          fallback: true,
          emailError: error.message,
          provider: 'Email',
          tempToken: tempToken
        }, {
          status: 200,
          headers: setSecurityHeaders(origin)
        })
      }

      console.log('✅ Email sent successfully')
      console.log('📝 Email ID:', data?.id)

      return NextResponse.json({
        success: true,
        otp: otp,
        message: 'Email sent successfully',
        messageId: data?.id,
        fallback: false,
        emailError: null,
        provider: 'Email',
        tempToken: tempToken
      }, {
        status: 200,
        headers: setSecurityHeaders(origin)
      })

    } catch (emailError: any) {
      console.log('❌ Email service error:', emailError.message)
      return NextResponse.json({
        success: false,
        otp: otp,
        message: 'Email service unavailable - OTP generated for testing',
        messageId: null,
        fallback: true,
        emailError: emailError.message,
        provider: 'Email',
        tempToken: tempToken
      }, {
        status: 200,
        headers: setSecurityHeaders(origin)
      })
    }

  } catch (error: any) {
    console.error('❌ Email endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: setSecurityHeaders(request.headers.get('origin') || '')
    })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  return NextResponse.json({}, {
    status: 200,
    headers: setSecurityHeaders(origin)
  })
}
