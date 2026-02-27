import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || ''
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'No token provided'
      })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return NextResponse.json({ 
        authenticated: true,
        user: { 
          username: decoded.username, 
          role: decoded.role 
        }
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
