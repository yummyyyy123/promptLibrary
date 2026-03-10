import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { SecurityLogger } from '@/lib/security-logger'

async function handler(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    try {
        const { data, error } = await SecurityLogger.getLogs(filter, limit)

        if (error) {
            console.error('❌ Error in security logs API:', error)
            return NextResponse.json({ error: 'Failed to fetch security logs' }, { status: 500 })
        }

        return NextResponse.json({ logs: data })
    } catch (err) {
        console.error('💥 Security logs API crash:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const GET = withAdminAuth(handler)
