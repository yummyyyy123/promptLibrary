// Simple test endpoint to debug the 500 error
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple test endpoint called')
    
    const body = await request.json()
    console.log('📝 Request body:', JSON.stringify(body, null, 2))
    
    const { phone } = body
    console.log('📱 Phone:', phone)
    
    // Generate simple OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('📱 Generated OTP:', otp)
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      otp: otp,
      phone: phone
    })
    
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error)
    console.error('❌ Error stack:', error.stack)
    
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  })
}
