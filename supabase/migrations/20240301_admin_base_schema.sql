-- Base Admin Schema for Advanced Security
-- This migration creates the tables required by the RLS policies in 20240302_security_rls.sql

-- Enable extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'content_reviewer' CHECK (role IN ('super_admin', 'department_admin', 'content_reviewer')),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_submissions table
CREATE TABLE IF NOT EXISTS admin_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    prompt TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    user_id UUID REFERENCES auth.users(id),
    department TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);
CREATE INDEX IF NOT EXISTS idx_admin_submissions_status ON admin_submissions(status);
CREATE INDEX IF NOT EXISTS idx_admin_submissions_department ON admin_submissions(department);
CREATE INDEX IF NOT EXISTS idx_admin_submissions_user_id ON admin_submissions(user_id);
