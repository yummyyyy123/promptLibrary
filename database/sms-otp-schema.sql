-- SMS OTP Database Schema
-- Run this in your Supabase SQL Editor

-- Admin Phone Numbers Table (securely store hashed phone numbers)
CREATE TABLE IF NOT EXISTS admin_phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL UNIQUE,
  phone_hash TEXT NOT NULL UNIQUE,
  phone_last_four TEXT NOT NULL, -- Store last 4 digits for identification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS OTPs Table
CREATE TABLE IF NOT EXISTS sms_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_hash TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_phone_numbers_admin_id ON admin_phone_numbers(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_phone_numbers_phone_hash ON admin_phone_numbers(phone_hash);
CREATE INDEX IF NOT EXISTS idx_sms_otps_phone_hash ON sms_otps(phone_hash);
CREATE INDEX IF NOT EXISTS idx_sms_otps_expires_at ON sms_otps(expires_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_admin_phone_numbers_updated_at 
    BEFORE UPDATE ON admin_phone_numbers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE admin_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage their own phone number" ON admin_phone_numbers
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage SMS OTPs" ON sms_otps
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to increment OTP attempts
CREATE OR REPLACE FUNCTION increment_attempts(phone_hash TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_attempts INTEGER;
BEGIN
    UPDATE sms_otps 
    SET attempts = attempts + 1 
    WHERE phone_hash = increment_attempts.phone_hash
    RETURNING attempts INTO current_attempts;
    
    RETURN COALESCE(current_attempts, 0);
END;
$$ LANGUAGE plpgsql;

-- Sample data (for testing - remove in production)
-- INSERT INTO admin_phone_numbers (admin_id, phone_hash, phone_last_four) VALUES
-- ('admin', 'hash_of_09948655838', '5583');

-- Clean up function (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sms_otps 
    WHERE expires_at < NOW() 
    OR (used = TRUE AND used_at < NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
