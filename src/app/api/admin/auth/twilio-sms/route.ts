// Real Twilio SMS Integration
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers and handle host validation
    const origin = request.headers.get('origin') || ''
    const host = request.headers.get('host') || ''
    
    console.log(`🌐 Twilio SMS Request: origin=${origin}, host=${host}`)
    
    let body;
    try {
      body = await request.json()
      console.log(`📝 Request body:`, JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid request body' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }

    const { phone } = body

    if (!phone) {
      console.error('❌ Phone number missing from request')
      return NextResponse.json({ 
        error: 'Phone number required' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }

    console.log(`📱 Processing SMS for phone: ${phone}`)

    // Validate phone number format
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Use 09XXXXXXXXX format (11 digits).' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }

    // Generate OTP
    let otp;
    try {
      // Simple OTP generation without importing SMSOTP
      otp = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`📱 Generated OTP: ${otp} for phone: ${phone}`)
      console.log(`⏰ Generated at: ${new Date().toISOString()}`)
    } catch (otpError) {
      console.error('❌ Failed to generate OTP:', otpError)
      return NextResponse.json({ 
        error: 'Failed to generate OTP' 
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }

    // Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    console.log(`🔍 Twilio config check: accountSid=${!!accountSid}, authToken=${!!authToken}, twilioPhone=${!!twilioPhone}`)

    if (!accountSid || !authToken || !twilioPhone) {
      console.log('⚠️ Twilio not configured, using fallback')
      // Return OTP even if Twilio is not configured
      return NextResponse.json({
        success: true,
        message: 'OTP generated (Twilio not configured)',
        otp: otp,
        fallback: true
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }

    // Import Twilio (server-side)
    try {
      console.log(`📱 Sending SMS via Twilio to ${phone}`)
      console.log(`🔍 OTP Code: ${otp}`)
      
      // Import Twilio dynamically
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
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })

    } catch (twilioError: any) {
      console.error('❌ Twilio SMS failed:', twilioError)
      console.error('❌ Twilio error details:', twilioError.message)
      
      // Return OTP even if SMS fails
      return NextResponse.json({ 
        error: 'Failed to send SMS via Twilio',
        details: twilioError.message,
        otp: otp, // Return OTP for testing even if SMS fails
        fallback: true
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
    }
  } catch (error: any) {
    console.error('SMS send error:', error)
    return NextResponse.json({ 
        error: 'Server error' 
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      })
  }
}
