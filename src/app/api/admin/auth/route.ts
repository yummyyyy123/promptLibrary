import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'root'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'r00t'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt received')
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { username, password } = body
    console.log('👤 Username:', username)
    console.log('🔑 Password provided:', password ? 'YES' : 'NO')
    console.log('🎯 Expected username:', ADMIN_USERNAME)
    console.log('🎯 Expected password:', ADMIN_PASSWORD ? 'SET' : 'NOT SET')

    // Validate credentials
    if (username !== ADMIN_USERNAME) {
      console.log('❌ Username mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials - username wrong' },
        { status: 401 }
      )
    }

    // Check password
    const isValidPassword = password === ADMIN_PASSWORD
    console.log('🔍 Password validation result:', isValidPassword)

    if (!isValidPassword) {
      console.log('❌ Password mismatch')
      return NextResponse.json(
        { error: 'Invalid credentials - password wrong' },
        { status: 401 }
      )
    }

    console.log('✅ Credentials validated successfully')

    // Generate JWT token
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
    console.log('🍪 Token generated successfully')

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: { username, role: 'admin' }
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: false, // Set to false for localhost
      sameSite: 'lax', // More permissive for localhost
      maxAge: 24 * 60 * 60 // 24 hours
    })

    console.log('🍪 Response with cookie set')
    return response

  } catch (error: any) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: 'Login failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🚪 Logout request received')
    
    // Clear the authentication cookie
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0 // Immediately expire the cookie
    })

    console.log('🍪 Cookie cleared for logout')
    return response

  } catch (error: any) {
    console.error('💥 Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
