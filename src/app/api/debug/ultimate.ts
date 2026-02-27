// ULTIMATE DEBUG: Check everything
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
      JWT_SECRET: process.env.JWT_SECRET,
      ADMIN_USERNAME: process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL
    }

    console.log('🔍 ULTIMATE DEBUG: All Environment Variables:')
    Object.entries(env).forEach(([key, value]) => {
      console.log(`${key}: ${value ? 'SET' : 'NOT SET'} ${value ? `(${value.substring(0, 20)}...)` : ''}`)
    })

    // Test Supabase connection directly
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      console.log('🔍 Testing Supabase connection...')
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
      
      // Test simple query
      const { data, error, count } = await supabase
        .from('prompts')
        .select('id, title')
        .limit(1)
      
      console.log('🔍 Supabase Test Results:')
      console.log('Data:', data)
      console.log('Error:', error)
      console.log('Count:', count)
      
      if (error) {
        return NextResponse.json({
          error: 'Supabase connection failed',
          details: error.message,
          env_status: env,
          test_results: { data: null, error: error.message, count: null }
        })
      }
      
      return NextResponse.json({
        message: 'Supabase connection successful',
        env_status: env,
        test_results: { data, error: null, count },
        prompts_available: !!data && data.length > 0
      })
    } else {
      return NextResponse.json({
        error: 'Environment variables missing',
        env_status: env,
        missing_vars: Object.entries(env).filter(([key, value]) => !value).map(([key]) => key)
      })
    }
  } catch (error: any) {
    console.error('💥 ULTIMATE DEBUG ERROR:', error)
    return NextResponse.json({
      error: 'Critical debug error',
      details: error.message,
      stack: error.stack
    })
  }
}
