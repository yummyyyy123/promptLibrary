// FORCE VERCEL API ROUTE DEPLOYMENT
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
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
}
