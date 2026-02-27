// Debug endpoint to test request handling
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.url
    const method = request.method
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('🔍 DEBUG REQUEST:')
    console.log('  URL:', url)
    console.log('  Method:', method)
    console.log('  Headers:', JSON.stringify(headers, null, 2))
    
    // Get host from various sources
    const host = headers.host || headers['x-forwarded-host'] || headers['x-vercel-forwarded-host'] || 'unknown'
    const origin = headers.origin || headers.referer || 'unknown'
    
    console.log('  Host:', host)
    console.log('  Origin:', origin)
    console.log('  User-Agent:', headers['user-agent'] || 'unknown')
    
    return NextResponse.json({
      message: 'Debug endpoint',
      request: {
        url,
        method,
        host,
        origin,
        headers,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('🔍 DEBUG POST REQUEST:')
    console.log('  Body:', JSON.stringify(body, null, 2))
    console.log('  Headers:', JSON.stringify(headers, null, 2))
    
    return NextResponse.json({
      message: 'Debug POST endpoint',
      request: {
        body,
        headers,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Debug POST endpoint error:', error)
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
