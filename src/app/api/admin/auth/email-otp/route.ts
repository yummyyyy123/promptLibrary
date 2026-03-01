// Email OTP delivery using Resend API
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { EmailOTP } from '@/lib/emailOTP'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Invalid email address format'
      }, { status: 400 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    console.log(`📧 Generating OTP for email: ${email}`)
    console.log(`🔍 OTP Code: ${otp}`)

    // Store OTP in EmailOTP system
    const stored = await EmailOTP.storeOTP(email, otp)
    if (!stored) {
      console.log('⚠️ Failed to store OTP, but continuing...')
    }

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
          provider: 'Email'
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
        provider: 'Email'
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
        provider: 'Email'
      })
    }

  } catch (error: any) {
    console.error('❌ Email endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
