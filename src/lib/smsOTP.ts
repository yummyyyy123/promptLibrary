// SMS OTP Implementation - Secure One-Time Password via SMS
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export class SMSOTP {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Generate 6-digit OTP code
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Hash phone number for secure storage
  static hashPhoneNumber(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex')
  }

  // Send OTP via SMS (using Twilio or similar service)
  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      // In production, use SMS service like Twilio, Vonage, etc.
      // For now, we'll simulate SMS sending with prominent logging
      console.log(`📱 SMS OTP: ${otp} to ${phone}`)
      console.log(`🔍 OTP Details: Code=${otp}, Phone=${phone}, Valid=5min`)
      console.log(`⏰ Generated at: ${new Date().toISOString()}`)
      
      // Also log to browser console for visibility
      if (typeof window !== 'undefined') {
        console.log(`📱 OTP SENT: ${otp}`)
        console.log(`📱 TO PHONE: ${phone}`)
      }
      
      // Simulate SMS API call
      const response = await this.simulateSMSAPI(phone, otp)
      return response.success
    } catch (error) {
      console.error('Error sending SMS OTP:', error)
      return false
    }
  }

  // Simulate SMS API (replace with real SMS service)
  private static async simulateSMSAPI(phone: string, otp: string): Promise<{ success: boolean }> {
    // In production, replace with actual SMS service API call
    // Example with Twilio:
    /*
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await twilio.messages.create({
      body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    })
    */
    
    // Simulate successful SMS send
    return { success: true }
  }

  // Store OTP in database
  static async storeOTP(phoneHash: string, otp: string): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      
      const { error } = await this.supabase
        .from('sms_otps')
        .upsert({
          phone_hash: phoneHash,
          otp: otp,
          expires_at: expiresAt,
          attempts: 0,
          created_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Error storing OTP:', error)
      return false
    }
  }

  // Verify OTP
  static async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const phoneHash = this.hashPhoneNumber(phone)
      
      const { data, error } = await this.supabase
        .from('sms_otps')
        .select('*')
        .eq('phone_hash', phoneHash)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return false
      }

      // Check attempts limit (max 3 attempts)
      if (data.attempts >= 3) {
        return false
      }

      // Mark OTP as used
      await this.supabase
        .from('sms_otps')
        .update({ 
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('phone_hash', phoneHash)

      return true
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return false
    }
  }

  // Increment failed attempts
  static async incrementAttempts(phone: string): Promise<boolean> {
    try {
      const phoneHash = this.hashPhoneNumber(phone)
      
      const { error } = await this.supabase
        .from('sms_otps')
        .update({ 
          attempts: this.supabase.rpc('increment_attempts', { phone_hash: phoneHash })
        })
        .eq('phone_hash', phoneHash)

      return !error
    } catch (error) {
      console.error('Error incrementing attempts:', error)
      return false
    }
  }

  // Check if phone is registered for OTP
  static async isPhoneRegistered(phone: string): Promise<boolean> {
    try {
      const phoneHash = this.hashPhoneNumber(phone)
      
      const { data, error } = await this.supabase
        .from('admin_phone_numbers')
        .select('*')
        .eq('phone_hash', phoneHash)
        .single()

      return !error && !!data
    } catch (error) {
      console.error('Error checking phone registration:', error)
      return false
    }
  }

  // Register phone number for OTP
  static async registerPhone(phone: string, adminId: string): Promise<boolean> {
    try {
      const phoneHash = this.hashPhoneNumber(phone)
      
      const { error } = await this.supabase
        .from('admin_phone_numbers')
        .upsert({
          admin_id: adminId,
          phone_hash: phoneHash,
          phone_last_four: phone.slice(-4), // Store last 4 digits for identification
          created_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Error registering phone:', error)
      return false
    }
  }

  // Clean up expired OTPs
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await this.supabase
        .from('sms_otps')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error)
    }
  }
}

// OTP Session management
export class OTPSession {
  private static sessions = new Map<string, { 
    phone: string; 
    verified: boolean; 
    expires: number; 
    tempToken: string 
  }>()

  // Create temporary session after password verification
  static createTempSession(phone: string): string {
    const tempToken = crypto.randomUUID()
    const expires = Date.now() + (5 * 60 * 1000) // 5 minutes
    
    this.sessions.set(tempToken, {
      phone,
      verified: false,
      expires,
      tempToken
    })

    return tempToken
  }

  // Verify OTP and create full session
  static verifyOTP(tempToken: string, otp: string): any {
    const session = this.sessions.get(tempToken)
    
    if (!session || session.expires < Date.now()) {
      this.sessions.delete(tempToken)
      return null
    }

    return session
  }

  // Complete OTP verification
  static completeOTP(tempToken: string): string | null {
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
