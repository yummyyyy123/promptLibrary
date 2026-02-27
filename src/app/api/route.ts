// ROOT API TEST - Check if Vercel is deploying API routes at all
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: "ROOT API WORKING",
    timestamp: new Date().toISOString(),
    vercel_env: process.env.VERCEL_ENV,
    node_env: process.env.NODE_ENV,
    deployment_check: true
  })
}
