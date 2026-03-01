// Real SMS delivery to phone 09948655838
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({
        error: 'Invalid phone number format. Use 09XXXXXXXXX format (11 digits).'
      }, { status: 400 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    console.log(`📱 Generating OTP for phone: ${phone}`)
    console.log(`🔍 OTP Code: ${otp}`)

    // Try multiple SMS services
    let smsResult = await trySendSMS(phone, otp)

    // Always return OTP to frontend (even if SMS fails)
    return NextResponse.json({
      success: smsResult.success,
      otp: otp,
      message: smsResult.message,
      messageId: smsResult.messageId,
      fallback: !smsResult.success,
      smsError: smsResult.error,
      provider: smsResult.provider
    })

  } catch (error: any) {
    console.error('❌ SMS endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function trySendSMS(phone: string, otp: string) {
  const providers = [
    { name: 'Twilio', func: sendTwilioSMS },
    { name: 'Vonage', func: sendVonageSMS },
    { name: 'AWS SNS', func: sendAWSSNSSMS },
    { name: 'Fallback', func: sendFallbackSMS }
  ]

  for (const provider of providers) {
    try {
      console.log(`📱 Trying ${provider.name}...`)
      const result = await provider.func(phone, otp)

      if (result && result.success) {
        console.log(`✅ ${provider.name} SMS sent successfully`)
        return {
          success: true,
          message: `${provider.name} SMS sent successfully`,
          messageId: result.messageId,
          provider: provider.name,
          error: null
        }
      }
    } catch (error: any) {
      console.log(`❌ ${provider.name} failed: ${error.message}`)
    }
  }

  console.log('❌ All SMS providers failed')
  return {
    success: false,
    message: 'All SMS providers failed - OTP generated for testing',
    messageId: null,
    provider: null,
    error: 'All SMS services unavailable'
  }
}

// Twilio SMS
async function sendTwilioSMS(phone: string, otp: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhone) {
    throw new Error('Twilio not configured')
  }

  const twilio = require('twilio')(accountSid, authToken)

  const message = await twilio.messages.create({
    body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    from: twilioPhone,
    to: phone
  })

  return { success: true, messageId: message.sid }
}

// Vonage SMS (formerly Nexmo)
async function sendVonageSMS(phone: string, otp: string) {
  const apiKey = process.env.VONAGE_API_KEY
  const apiSecret = process.env.VONAGE_API_SECRET
  const from = process.env.VONAGE_PHONE_NUMBER

  if (!apiKey || !apiSecret || !from) {
    throw new Error('Vonage not configured')
  }

  const response = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      api_secret: apiSecret,
      to: phone,
      from: from,
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`
    })
  })

  const data = await response.json()

  if (data.messages && data.messages[0].status === '0') {
    return { success: true, messageId: data.messages[0]['message-id'] }
  }

  throw new Error(data.messages[0]['error-text'] || 'Vonage SMS failed')
}

// AWS SNS SMS
async function sendAWSSNSSMS(phone: string, otp: string) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION || 'us-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS SNS not configured')
  }

  // AWS SNS would require aws-sdk, but for now throw error
  throw new Error('AWS SNS not implemented - requires aws-sdk')
}

// Fallback SMS (placeholder for other services)
async function sendFallbackSMS(phone: string, otp: string) {
  // This is where you could integrate other SMS services
  // For example: MessageBird, SendGrid, etc.

  console.log('📱 Fallback SMS service - not sending real SMS')
  console.log(`📱 Would send OTP ${otp} to ${phone}`)

  // Return success for testing, but don't actually send SMS
  return { success: false, messageId: null }
}
