// Real Twilio SMS Integration
import { NextRequest, NextResponse } from 'next/server'
import { SMSOTP } from '@/lib/smsOTP'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ 
        error: 'Phone number required' 
      }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Use 09XXXXXXXXX format (11 digits).' 
      }, { status: 400 })
    }

    // Generate OTP
    const { SMSOTP } = await import('@/lib/smsOTP')
    const otp = SMSOTP.generateOTP()
    
    console.log(`📱 Generated OTP: ${otp} for phone: ${phone}`)
    console.log(`⏰ Generated at: ${new Date().toISOString()}`)

    // Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json({ 
        error: 'Twilio not configured. Missing environment variables.' 
      }, { status: 500 })
    }

    // Import Twilio (server-side)
    try {
      console.log(`📱 Sending SMS via Twilio to ${phone}`)
      console.log(`🔍 OTP Code: ${otp}`)
      
      // Import Twilio (server-side)
      const twilio = require('twilio')(accountSid, authToken)

      const message = await twilio.messages.create({
        body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: twilioPhone,
        to: phone
      })

      console.log('✅ Twilio SMS sent successfully')
      console.log(`📝 Message SID: ${message.sid}`)
      console.log(`📱 Status: ${message.status}`)

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully via Twilio',
        messageId: message.sid,
        status: message.status,
        otp: otp // Return OTP for testing
      })

    } catch (error: any) {
      console.error('❌ Twilio SMS failed:', error)
      return NextResponse.json({ 
        error: 'Failed to send SMS via Twilio',
        details: error.message,
        otp: otp // Return OTP for testing even if SMS fails
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('SMS send error:', error)
    return NextResponse.json({ 
      error: 'Server error' 
    }, { status: 500 })
  }
}
