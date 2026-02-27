import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test the prompts API
    const response = await fetch('http://localhost:3000/api/prompts')
    const data = await response.json()
    
    return NextResponse.json({
      debug: 'Testing prompts API',
      promptsData: data,
      promptsCount: data.prompts?.length || 0,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        supabaseKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
        adminUsername: process.env.ADMIN_USERNAME ? 'SET' : 'NOT SET',
        adminPassword: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error?.message || 'Unknown error'
    })
  }
}
