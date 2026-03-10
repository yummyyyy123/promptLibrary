import { createClient } from '@supabase/supabase-js'

let supabase: any = null

function getSupabase() {
    if (supabase) return supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    supabase = createClient(supabaseUrl, supabaseKey)
    return supabase
}

export type SecurityEventType =
    | 'login_failure'
    | 'login_success'
    | 'mfa_requested'
    | 'mfa_verify_failure'
    | 'mfa_verify_success'
    | 'mfa_bypass_attempt'
    | 'rate_limit_triggered'
    | 'unauthorized_access'

export interface SecurityEventOptions {
    eventType: SecurityEventType
    severity?: 'info' | 'warning' | 'critical'
    ip?: string
    userAgent?: string
    details?: Record<string, any>
}

export class SecurityLogger {
    static async logEvent(options: SecurityEventOptions) {
        const { eventType, severity = 'info', ip, userAgent, details = {} } = options

        try {
            console.log(`🛡️  Security Event: [${eventType.toUpperCase()}] at ${ip || 'unknown'}`)

            const { error } = await getSupabase()
                .from('security_logs')
                .insert([
                    {
                        event_type: eventType,
                        severity,
                        ip_address: ip,
                        user_agent: userAgent,
                        details
                    }
                ])

            if (error) {
                console.error('❌ Failed to write to security_logs:', error.message)
            }
        } catch (err) {
            console.error('❌ SecurityLogger error:', err)
        }
    }

    // Simplified helper for common events
    static async logUnauthorized(path: string, ip?: string, userAgent?: string) {
        await this.logEvent({
            eventType: 'unauthorized_access',
            severity: 'warning',
            ip,
            userAgent,
            details: { path }
        })
    }

    static async logRateLimit(ip: string, path: string) {
        await this.logEvent({
            eventType: 'rate_limit_triggered',
            severity: 'warning',
            ip,
            details: { path }
        })
    }
}
