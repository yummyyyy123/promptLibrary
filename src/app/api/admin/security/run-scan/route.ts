import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const POST = withAdminAuth(async (request: NextRequest) => {
    try {
        console.log('🛡️ Starting server-side security scan...')

        // Execute the full security suite
        // We use full path or ensure it's run from the project root
        // On local Windows, this should work fine.
        const { stdout, stderr } = await execAsync('npm run security:full', {
            timeout: 300000, // 5 minute timeout
            env: { ...process.env, APP_URL: process.env.APP_URL || 'http://localhost:3000' }
        })

        return NextResponse.json({
            success: true,
            output: stdout,
            errors: stderr,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('Security Scan Error:', error)

        // Even if it fails (exit code 1 is common for security findings), 
        // we want to return the output so the user can see what failed.
        return NextResponse.json({
            success: false,
            error: 'Scan completed with findings or failed to execute',
            output: error.stdout || '',
            errors: error.stderr || error.message,
            timestamp: new Date().toISOString()
        }, { status: error.stdout ? 200 : 500 })
    }
})
