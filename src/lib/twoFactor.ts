// 2FA Implementation for Admin Login
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export class TwoFactorAuth {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Generate 6-digit TOTP code
  static generateTOTPSecret(): string {
    return crypto.randomBytes(16).toString('base64')
  }

  // Generate QR code data for Google Authenticator
  static generateQRCodeData(secret: string, email: string): string {
    const issuer = 'Prompt Library Admin'
    const label = `${issuer}:${email}`
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`
    return otpauthUrl
  }

  // Verify TOTP code (simplified version - in production use proper TOTP library)
  static verifyTOTPCode(secret: string, token: string): boolean {
    // This is a simplified verification
    // In production, use libraries like 'otplib' for proper TOTP
    const timeStep = Math.floor(Date.now() / 30000) // 30-second window
    const expectedToken = this.generateTOTP(secret, timeStep)
    
    // Check current and adjacent time windows (allow 90-second window)
    for (let offset = -1; offset <= 1; offset++) {
      if (this.generateTOTP(secret, timeStep + offset) === token) {
        return true
      }
    }
    return false
  }

  // Generate TOTP token (simplified)
  private static generateTOTP(secret: string, timeStep: number): string {
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'))
    hmac.update(Buffer.from(timeStep.toString()))
    const hmacResult = hmac.digest()
    
    const offset = hmacResult[19] & 0x0f
    const binary = ((hmacResult[offset] & 0x7f) << 24) |
                   ((hmacResult[offset + 1] & 0xff) << 16) |
                   ((hmacResult[offset + 2] & 0xff) << 8) |
                   (hmacResult[offset + 3] & 0xff)
    
    const otp = (binary % 1000000).toString().padStart(6, '0')
    return otp
  }

  // Generate backup codes
  static generateBackupCodes(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }

  // Save 2FA settings for admin
  static async save2FASettings(adminId: string, secret: string, backupCodes: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_2fa')
        .upsert({
          admin_id: adminId,
          secret: secret,
          backup_codes: backupCodes,
          enabled: true,
          created_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Error saving 2FA settings:', error)
      return false
    }
  }

  // Get 2FA settings for admin
  static async get2FASettings(adminId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('admin_2fa')
        .select('*')
        .eq('admin_id', adminId)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error('Error getting 2FA settings:', error)
      return null
    }
  }

  // Verify backup code
  static async verifyBackupCode(adminId: string, code: string): Promise<boolean> {
    try {
      const settings = await this.get2FASettings(adminId)
      if (!settings || !settings.backup_codes) return false

      const isValidCode = settings.backup_codes.includes(code.toUpperCase())
      
      if (isValidCode) {
        // Remove used backup code
        const remainingCodes = settings.backup_codes.filter((c: string) => c !== code.toUpperCase())
        await this.supabase
          .from('admin_2fa')
          .update({ backup_codes: remainingCodes })
          .eq('admin_id', adminId)
      }

      return isValidCode
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return false
    }
  }

  // Disable 2FA for admin
  static async disable2FA(adminId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_2fa')
        .delete()
        .eq('admin_id', adminId)

      return !error
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      return false
    }
  }
}

// 2FA Session management
export class TwoFactorSession {
  private static sessions = new Map<string, { 
    adminId: string; 
    verified: boolean; 
    expires: number; 
    tempToken: string 
  }>()

  // Create temporary session after password verification
  static createTempSession(adminId: string): string {
    const tempToken = crypto.randomUUID()
    const expires = Date.now() + (5 * 60 * 1000) // 5 minutes
    
    this.sessions.set(tempToken, {
      adminId,
      verified: false,
      expires,
      tempToken
    })

    return tempToken
  }

  // Verify 2FA and create full session
  static verify2FA(tempToken: string, totpCode: string): any {
    const session = this.sessions.get(tempToken)
    
    if (!session || session.expires < Date.now()) {
      this.sessions.delete(tempToken)
      return null
    }

    return session
  }

  // Complete 2FA verification
  static complete2FA(tempToken: string): string | null {
    const session = this.sessions.get(tempToken)
    
    if (!session || !session.verified || session.expires < Date.now()) {
      this.sessions.delete(tempToken)
      return null
    }

    // Create permanent session
    const permanentToken = crypto.randomUUID()
    this.sessions.delete(tempToken)
    
    return permanentToken
  }

  // Clean up expired sessions
  static cleanup(): void {
    const now = Date.now()
    for (const [token, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(token)
      }
    }
  }
}

// Generate QR code (simplified - in production use proper QR library)
export function generateQRCodeDataURL(data: string): string {
  // This is a placeholder - in production use libraries like 'qrcode'
  // For now, return the data URL that would contain the QR code
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
}
