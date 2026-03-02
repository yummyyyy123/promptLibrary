// FORCE VERCEL API ROUTE DEPLOYMENT
import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({
    message: "API ROUTES WORKING",
    timestamp: new Date().toISOString(),
    routes: {
      prompts: "/api/prompts",
      admin_auth: "/api/admin/auth",
      admin_submissions: "/api/admin/submissions",
      debug_simple: "/api/debug/simple",
      debug_ultimate: "/api/debug/ultimate"
    },
    deployment_status: "testing"
  })

  // Add Security Headers
  const origin = typeof process !== 'undefined' ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : 'http://localhost:3000'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return response
}
