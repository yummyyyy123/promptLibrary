import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check for admin-token cookie
    const cookieHeader = request.cookies.get('admin-token')?.value || ''
    
    if (!cookieHeader) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Verify JWT token
    const { default: jwt } = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
    
    try {
      const decoded = jwt.verify(cookieHeader, JWT_SECRET) as any
      return NextResponse.json({ 
        authenticated: true,
        user: { username: decoded.username, role: decoded.role }
      })
    } catch (error: any) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid token'
      })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      authenticated: false,
      error: 'Server error'
    })
  }
}
