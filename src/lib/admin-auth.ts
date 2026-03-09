import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Admin credentials — required environment variables (no defaults allowed)
function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''
const JWT_SECRET = process.env.JWT_SECRET ?? ''

interface AdminAuthResult {
  success: boolean
  token?: string
  error?: string
}

export function validateAdminCredentials(username: string, password: string): boolean {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Server misconfiguration: admin credentials not set')
  }
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export function authenticateAdmin(request: NextRequest): AdminAuthResult {
  try {
    // Get authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('admin-token')?.value

    let token = ''
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return { success: false, error: 'Missing or invalid authentication' }
    }

    try {
      if (!JWT_SECRET) {
        return { success: false, error: 'Server misconfiguration: JWT_SECRET not set' }
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any

      // Check if token is for admin
      if (decoded.role !== 'admin') {
        return { success: false, error: 'Invalid admin credentials' }
      }

      // Check if token is expired
      if (decoded.exp && Date.now() > decoded.exp * 1000) {
        return { success: false, error: 'Token expired' }
      }

      return { success: true }
    } catch (jwtError) {
      return { success: false, error: 'Invalid token' }
    }
  } catch (error) {
    return { success: false, error: 'Authentication failed' }
  }
}

export function generateAdminToken(username: string, password: string): AdminAuthResult {
  try {
    if (!JWT_SECRET) {
      return { success: false, error: 'Server misconfiguration: JWT_SECRET not set' }
    }

    // Validate credentials
    if (!validateAdminCredentials(username, password)) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: ADMIN_USERNAME,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    )

    return { success: true, token }
  } catch (error) {
    return { success: false, error: 'Token generation failed' }
  }
}

// Middleware for admin API routes
export function withAdminAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const auth = authenticateAdmin(request)

      if (!auth.success) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: auth.error || 'Authentication required',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        )
      }

      // Add security headers
      const response = await handler(request)

      // Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      return response
    } catch (error: any) {
      console.error('💥 Admin Auth Middleware Error:', error)
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'An unexpected authentication error occurred',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }
  }
}

