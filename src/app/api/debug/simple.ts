// SIMPLE DEBUG: Just check if API is working
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: "API is working",
    timestamp: new Date().toISOString(),
    method: "GET",
    endpoint: "/api/debug/simple"
  })
}
