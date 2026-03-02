-- Advanced Row Level Security (RLS) Policy for Sensitive Data
-- This policy implements multiple security layers beyond basic auth.uid()

-- Enable RLS on the sensitive table
ALTER TABLE admin_submissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin Access (full access to all submissions)
CREATE POLICY "Super admins can view all submissions" ON admin_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- Policy 2: Department Admin Access (access to submissions from their department only)
CREATE POLICY "Department admins can view their department submissions" ON admin_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'department_admin'
            AND admin_users.department = admin_submissions.department
            AND admin_users.is_active = true
        )
    );

-- Policy 3: Content Reviewer Access (read-only access to pending submissions)
CREATE POLICY "Content reviewers can view pending submissions" ON admin_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'content_reviewer'
            AND admin_submissions.status = 'pending'
            AND admin_users.is_active = true
        )
    );

-- Policy 4: Submission Creator Access (users can only view their own submissions)
CREATE POLICY "Users can view their own submissions" ON admin_submissions
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policy 5: Submission Creator Update (users can update their own pending submissions only)
CREATE POLICY "Users can update their own pending submissions" ON admin_submissions
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending'
    );

-- Policy 6: Admin Approval (department admins can approve submissions in their department)
CREATE POLICY "Department admins can approve department submissions" ON admin_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('department_admin', 'super_admin')
            AND (
                admin_users.role = 'super_admin' 
                OR admin_users.department = admin_submissions.department
            )
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        (
            -- Department admins can only change status to approved/rejected
            EXISTS (
                SELECT 1 FROM admin_users 
                WHERE admin_users.id = auth.uid() 
                AND admin_users.role = 'department_admin'
                AND admin_users.department = admin_submissions.department
                AND admin_users.is_active = true
            )
            AND new.status IN ('approved', 'rejected')
        )
        OR
        (
            -- Super admins can change any status
            EXISTS (
                SELECT 1 FROM admin_users 
                WHERE admin_users.id = auth.uid() 
                AND admin_users.role = 'super_admin'
                AND admin_users.is_active = true
            )
        )
    );

-- Policy 7: Insert Restrictions (only authenticated users can create submissions)
CREATE POLICY "Authenticated users can create submissions" ON admin_submissions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND status = 'pending'
    );

-- Policy 8: Delete Restrictions (only super admins can delete submissions)
CREATE POLICY "Super admins can delete submissions" ON admin_submissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'super_admin'
            AND admin_users.is_active = true
        )
    );

-- Additional Security: Audit Function
CREATE OR REPLACE FUNCTION audit_submission_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log all changes to audit table
    INSERT INTO admin_submission_audit (
        submission_id,
        changed_by,
        action,
        old_status,
        new_status,
        changed_at,
        ip_address,
        user_agent
    ) VALUES (
        NEW.id,
        auth.uid(),
        TG_OP,
        OLD.status,
        NEW.status,
        NOW(),
        current_setting('request.headers')::json->>'x-forwarded-for',
        current_setting('request.headers')::json->>'user-agent'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_submission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES admin_submissions(id),
    changed_by UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE admin_submission_audit ENABLE ROW LEVEL SECURITY;

-- Audit table policies (only admins can view audit logs)
CREATE POLICY "Admins can view audit logs" ON admin_submission_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role IN ('department_admin', 'super_admin')
            AND admin_users.is_active = true
        )
    );

-- Create trigger for audit logging
CREATE TRIGGER audit_submission_changes_trigger
    AFTER UPDATE ON admin_submissions
    FOR EACH ROW
    EXECUTE FUNCTION audit_submission_changes();

-- Security Function: Check if user has admin privileges for specific department
CREATE OR REPLACE FUNCTION has_department_admin_privileges(dept_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid() 
        AND (
            admin_users.role = 'super_admin'
            OR (
                admin_users.role = 'department_admin' 
                AND admin_users.department = dept_name
            )
        )
        AND admin_users.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Function: Check if user can access submission
CREATE OR REPLACE FUNCTION can_access_submission(submission_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_submissions 
        WHERE admin_submissions.id = submission_id
        AND (
            -- User owns the submission
            admin_submissions.user_id = auth.uid()
            OR
            -- User is super admin
            EXISTS (
                SELECT 1 FROM admin_users 
                WHERE admin_users.id = auth.uid() 
                AND admin_users.role = 'super_admin'
                AND admin_users.is_active = true
            )
            OR
            -- User is department admin for this submission's department
            EXISTS (
                SELECT 1 FROM admin_users 
                WHERE admin_users.id = auth.uid() 
                AND admin_users.role = 'department_admin'
                AND admin_users.department = admin_submissions.department
                AND admin_users.is_active = true
            )
            OR
            -- User is content reviewer and submission is pending
            EXISTS (
                SELECT 1 FROM admin_users 
                WHERE admin_users.id = auth.uid() 
                AND admin_users.role = 'content_reviewer'
                AND admin_submissions.status = 'pending'
                AND admin_users.is_active = true
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
