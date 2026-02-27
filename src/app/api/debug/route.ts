import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test prompts API with relative URL (works both local and production)
    const promptsUrl = '/api/prompts'
    const response = await fetch(promptsUrl)
    const data = await response.json()
    
    // Test environment variables
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
      promptsData: data,
      promptsCount: data.prompts?.length || 0,
      fetchUrl: promptsUrl,
      fetchStatus: response.ok,
      fetchError: response.ok ? null : response.statusText
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      fetchError: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
