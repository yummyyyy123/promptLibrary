// Register your phone number for 2FA
import { NextRequest, NextResponse } from 'next/server'
import { SMSOTP } from '@/lib/smsOTP'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Validate phone number format (Philippines format)
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Use 09XXXXXXXXX format (11 digits).' }, { status: 400 })
    }

    // Register phone number for admin
    const success = await SMSOTP.registerPhone(phone, 'admin')

    if (!success) {
      return NextResponse.json({ error: 'Failed to register phone number' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Phone number registered successfully for 2FA',
      phoneLastFour: phone.slice(-4)
    })

  } catch (error: any) {
    console.error('Phone registration error:', error)
    return NextResponse.json({ error: 'Failed to register phone number' }, { status: 500 })
  }
}
