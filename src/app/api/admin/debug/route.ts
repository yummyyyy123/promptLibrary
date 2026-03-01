import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'SET' : 'NOT SET',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }

    // Test database connection
    let dbStatus = 'NOT TESTED'
    let dbError = null
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Test connection with a simple query
        const { data, error } = await supabase
          .from('submissions')
          .select('count')
          .limit(1)
        
        if (error) {
          dbError = error.message
          dbStatus = 'ERROR'
        } else {
          dbStatus = 'CONNECTED'
        }
      } else {
        dbStatus = 'MISSING CREDENTIALS'
      }
    } catch (error: any) {
      dbError = error.message
      dbStatus = 'FAILED'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        status: dbStatus,
        error: dbError
      },
      message: 'Admin debug information'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
