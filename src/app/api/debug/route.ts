import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test environment variables only - no API calls
    const environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      supabaseKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
      adminUsername: process.env.ADMIN_USERNAME ? 'SET' : 'NOT SET',
      adminPassword: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET',
      usingSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
    }

    return NextResponse.json({
      message: 'Environment check completed',
      environment,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Environment check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
