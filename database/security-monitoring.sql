-- Security Monitoring Table
-- This table tracks security-related events like failed logins and bypass attempts.

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- e.g., 'login_failure', 'mfa_bypass_attempt', 'rate_limit_triggered', 'unauthorized_access'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins should be able to read security logs
-- (Assuming auth.uid() check or role check if you have users table)
-- For now, we allow the service role (backend) to write.
CREATE POLICY "Admins can view security logs" ON security_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- Notification function (Optional: can be used for webhooks/email alerts)
-- CREATE OR REPLACE FUNCTION notify_security_event()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Log to console or send webhook if severity is critical
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
