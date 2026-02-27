// 2FA Verification API
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { TwoFactorAuth, TwoFactorSession } from '@/lib/twoFactor'

export async function POST(request: NextRequest) {
  try {
    const { username, password, totpCode, backupCode } = await request.json()
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

    // Step 1: Verify username and password
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Step 2: Check if 2FA is enabled for this admin
    const settings = await TwoFactorAuth.get2FASettings(username)
    
    if (!settings || !settings.enabled) {
      // No 2FA enabled, create normal JWT
      const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      const response = NextResponse.json({
        message: 'Login successful',
        requires2FA: false,
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

    // Step 3: 2FA is enabled, verify TOTP or backup code
    let isValid2FA = false

    if (totpCode) {
      isValid2FA = TwoFactorAuth.verifyTOTPCode(settings.secret, totpCode)
    } else if (backupCode) {
      isValid2FA = await TwoFactorAuth.verifyBackupCode(username, backupCode)
    }

    if (!isValid2FA) {
      return NextResponse.json({ 
        error: 'Invalid 2FA code',
        requires2FA: true
      }, { status: 401 })
    }

    // Step 4: Create JWT token
    const token = jwt.sign(
      { username, role: 'admin', twoFactorVerified: true },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    const response = NextResponse.json({
      message: 'Login successful',
      requires2FA: false,
      token
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 // 1 hour
    })

    return response

  } catch (error: any) {
    console.error('2FA verification error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        requires2FA: false
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const settings = await TwoFactorAuth.get2FASettings(decoded.username)

    return NextResponse.json({
      authenticated: true,
      requires2FA: settings?.enabled || false,
      twoFactorVerified: decoded.twoFactorVerified || false
    })

  } catch (error: any) {
    return NextResponse.json({ 
      authenticated: false,
      requires2FA: false
    })
  }
}
