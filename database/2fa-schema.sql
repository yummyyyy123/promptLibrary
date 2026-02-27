-- 2FA Settings Table for Admin Users
CREATE TABLE IF NOT EXISTS admin_2fa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_2fa_admin_id ON admin_2fa(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_enabled ON admin_2fa(enabled);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_2fa_updated_at 
    BEFORE UPDATE ON admin_2fa 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE admin_2fa ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage their own 2FA" ON admin_2fa
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Sample data (for testing)
-- INSERT INTO admin_2fa (admin_id, secret, backup_codes, enabled) VALUES
-- ('admin', 'JBSWY3DPEHPK3PXP', ARRAY['ABCD1234', 'EFGH5678', 'IJKL9012', 'MNOP3456', 'QRST7890', 'UVWX1234', 'YZAB5678', 'CDEF9012', 'GHIJ3456', 'KLMN7890'], TRUE);
