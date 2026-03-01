// Email OTP utilities for 2FA authentication
export class EmailOTP {
  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Store OTP in memory (for development)
  private static otpStore: Map<string, { code: string; timestamp: number; attempts: number }> = new Map()

  // Store OTP with 5-minute expiration
  static async storeOTP(email: string, otp: string): Promise<boolean> {
    try {
      // Store in memory for development
      this.otpStore.set(email, {
        code: otp,
        timestamp: Date.now(),
        attempts: 0
      })
      
      console.log(`📧 OTP stored for ${email}: ${otp}`)
      return true
    } catch (error) {
      console.error('❌ Failed to store OTP:', error)
      return false
    }
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const stored = this.otpStore.get(email)
      
      if (!stored) {
        console.log(`❌ No OTP found for ${email}`)
        return false
      }

      // Check if OTP is expired (5 minutes)
      const isExpired = Date.now() - stored.timestamp > 5 * 60 * 1000
      if (isExpired) {
        console.log(`❌ OTP expired for ${email}`)
        this.otpStore.delete(email)
        return false
      }

      // Check if too many attempts (3 attempts)
      if (stored.attempts >= 3) {
        console.log(`❌ Too many attempts for ${email}`)
        this.otpStore.delete(email)
        return false
      }

      // Verify OTP
      const isValid = stored.code === otp
      if (isValid) {
        console.log(`✅ OTP verified for ${email}`)
        this.otpStore.delete(email) // Remove after successful verification
      } else {
        console.log(`❌ Invalid OTP for ${email}. Attempt ${stored.attempts + 1}`)
        stored.attempts++
      }

      return isValid
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error)
      return false
    }
  }

  // Increment failed attempts
  static async incrementAttempts(email: string): Promise<void> {
    try {
      const stored = this.otpStore.get(email)
      if (stored) {
        stored.attempts++
        console.log(`📊 Attempts incremented for ${email}: ${stored.attempts}`)
      }
    } catch (error) {
      console.error('❌ Failed to increment attempts:', error)
    }
  }

  // Register email (for future use)
  static async registerEmail(email: string, username: string): Promise<boolean> {
    try {
      console.log(`📧 Email registered: ${email} for user: ${username}`)
      return true
    } catch (error) {
      console.error('❌ Failed to register email:', error)
      return false
    }
  }

  // Clean up expired OTPs
  static cleanupExpiredOTPs(): void {
    const now = Date.now()
    for (const [email, data] of this.otpStore.entries()) {
      if (now - data.timestamp > 5 * 60 * 1000) {
        this.otpStore.delete(email)
        console.log(`🧹 Cleaned up expired OTP for ${email}`)
      }
    }
  }
}

// OTP Session management
export class OTPSession {
  private static sessions: Map<string, { email: string; timestamp: number }> = new Map()

  // Create temporary session
  static createTempSession(email: string): string {
    const token = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    this.sessions.set(token, {
      email,
      timestamp: Date.now()
    })
    
    console.log(`🔐 Temp session created for ${email}: ${token}`)
    return token
  }

  // Verify temporary session
  static verifyTempSession(token: string): string | null {
    const session = this.sessions.get(token)
    if (!session) {
      console.log(`❌ Invalid temp session: ${token}`)
      return null
    }

    // Check if session is expired (5 minutes)
    const isExpired = Date.now() - session.timestamp > 5 * 60 * 1000
    if (isExpired) {
      console.log(`❌ Temp session expired: ${token}`)
      this.sessions.delete(token)
      return null
    }

    console.log(`✅ Temp session verified: ${token}`)
    return session.email
  }

  // Complete OTP verification
  static completeOTP(tempToken: string): string | null {
    const email = this.verifyTempSession(tempToken)
    if (!email) {
      return null
    }

    // Remove temporary session
    this.sessions.delete(tempToken)
    
    // Create permanent token
    const permanentToken = 'perm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    
    console.log(`🎉 OTP completed for ${email}, permanent token: ${permanentToken}`)
    return permanentToken
  }

  // Clean up expired sessions
  static cleanupExpiredSessions(): void {
    const now = Date.now()
    for (const [token, data] of this.sessions.entries()) {
      if (now - data.timestamp > 5 * 60 * 1000) {
        this.sessions.delete(token)
        console.log(`🧹 Cleaned up expired session: ${token}`)
      }
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  EmailOTP.cleanupExpiredOTPs()
  OTPSession.cleanupExpiredSessions()
}, 5 * 60 * 1000)
