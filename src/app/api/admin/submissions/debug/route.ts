// DEBUG ADMIN SUBMISSIONS - Show exactly what's happening
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG ADMIN: Request received')
    
    // Check authentication
    const token = request.cookies.get('admin-token')?.value
    console.log('🔍 DEBUG ADMIN: Token present:', !!token)
    
    if (!token) {
      console.log('🔍 DEBUG ADMIN: No token found')
      return NextResponse.json({
        error: 'No token found',
        debug: {
          authenticated: false,
          reason: 'no_token'
        }
      }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      console.log('🔍 DEBUG ADMIN: Token decoded:', decoded)
      
      if (decoded.role !== 'admin') {
        console.log('🔍 DEBUG ADMIN: Not admin role')
        return NextResponse.json({
          error: 'Not authorized',
          debug: {
            authenticated: false,
            reason: 'not_admin',
            role: decoded.role
          }
        }, { status: 401 })
      }
    } catch (jwtError) {
      console.log('🔍 DEBUG ADMIN: JWT error:', jwtError)
      return NextResponse.json({
        error: 'Invalid token',
        debug: {
          authenticated: false,
          reason: 'invalid_jwt',
          jwtError: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
        }
      }, { status: 401 })
    }

    console.log('🔍 DEBUG ADMIN: Authentication successful')

    // Check Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    console.log('🔍 DEBUG ADMIN: Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('🔍 DEBUG ADMIN: Supabase Key:', supabaseKey ? 'SET' : 'NOT SET')

    if (!supabaseUrl || !supabaseKey) {
      console.log('🔍 DEBUG ADMIN: Supabase credentials missing')
      return NextResponse.json({
        error: 'Supabase credentials not configured',
        debug: {
          authenticated: true,
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        }
      }, { status: 500 })
    }

    console.log('🔍 DEBUG ADMIN: Creating Supabase client...')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 DEBUG ADMIN: Fetching from submissions table...')
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    console.log('🔍 DEBUG ADMIN: Supabase response:')
    console.log('  - Submissions:', submissions)
    console.log('  - Error:', error)

    if (error) {
      console.log('🔍 DEBUG ADMIN: Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to fetch submissions',
        debug: {
          authenticated: true,
          supabaseConnected: true,
          error: error.message
        }
      }, { status: 500 })
    }

    const stats = {
      total: submissions?.length || 0,
      pending: submissions?.filter(s => s.status === 'pending').length || 0,
      approved: submissions?.filter(s => s.status === 'approved').length || 0,
      rejected: submissions?.filter(s => s.status === 'rejected').length || 0
    }

    console.log('🔍 DEBUG ADMIN: Success!')
    console.log('🔍 DEBUG ADMIN: Stats:', stats)

    return NextResponse.json({
      message: 'Debug successful',
      debug: {
        authenticated: true,
        supabaseConnected: true,
        submissionsCount: submissions?.length || 0,
        stats,
        submissions: submissions || []
      }
    })

  } catch (error: any) {
    console.error('💥 DEBUG ADMIN: Critical error:', error)
    return NextResponse.json({
      error: 'Critical error',
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    }, { status: 500 })
  }
}
