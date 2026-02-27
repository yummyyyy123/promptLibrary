// SIMPLE DEBUG - Fixed version
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: "SIMPLE DEBUG WORKING",
    timestamp: new Date().toISOString(),
    method: "GET",
    endpoint: "/api/debug/simple",
    status: "fixed"
  })
}
