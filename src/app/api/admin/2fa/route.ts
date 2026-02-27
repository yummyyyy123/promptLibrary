// 2FA Setup API
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { TwoFactorAuth, generateQRCodeDataURL } from '@/lib/twoFactor'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const adminId = decoded.username

    // Generate 2FA secret
    const secret = TwoFactorAuth.generateTOTPSecret()
    const backupCodes = TwoFactorAuth.generateBackupCodes()
    
    // Generate QR code data
    const qrData = TwoFactorAuth.generateQRCodeData(secret, decoded.username)
    const qrDataURL = generateQRCodeDataURL(qrData)

    // Save 2FA settings (but don't enable yet)
    await TwoFactorAuth.save2FASettings(adminId, secret, backupCodes)

    return NextResponse.json({
      secret,
      qrDataURL,
      backupCodes,
      message: '2FA setup initiated. Please scan QR code and verify.'
    })

  } catch (error: any) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { totpCode } = await request.json()

    if (!totpCode) {
      return NextResponse.json({ error: 'TOTP code required' }, { status: 400 })
    }

    const adminId = decoded.username
    const settings = await TwoFactorAuth.get2FASettings(adminId)

    if (!settings) {
      return NextResponse.json({ error: '2FA not setup' }, { status: 400 })
    }

    // Verify TOTP code
    const isValid = TwoFactorAuth.verifyTOTPCode(settings.secret, totpCode)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 })
    }

    // Enable 2FA
    const success = await TwoFactorAuth.save2FASettings(adminId, settings.secret, settings.backup_codes)

    if (!success) {
      return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 })
    }

    return NextResponse.json({
      message: '2FA enabled successfully',
      enabled: true
    })

  } catch (error: any) {
    console.error('2FA enable error:', error)
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const adminId = decoded.username

    // Disable 2FA
    const success = await TwoFactorAuth.disable2FA(adminId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
    }

    return NextResponse.json({
      message: '2FA disabled successfully',
      enabled: false
    })

  } catch (error: any) {
    console.error('2FA disable error:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
