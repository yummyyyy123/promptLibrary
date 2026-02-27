// ADMIN PROMPTS - Bulk delete all approved prompts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// JWT authentication middleware
function authenticate(request: NextRequest): boolean {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return false
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.role === 'admin'
  } catch (error) {
    return false
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 ADMIN PROMPTS: Deleting all approved prompts...')

    // Delete all approved prompts
    const { data, error } = await supabase
      .from('prompts')
      .delete()
      .eq('status', 'approved')

    if (error) {
      console.error('💥 ADMIN PROMPTS: Bulk delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete approved prompts' },
        { status: 500 }
      )
    }

    console.log('✅ ADMIN PROMPTS: Bulk delete successful!')

    return NextResponse.json({
      message: 'All approved prompts deleted successfully',
      deletedCount: data,
      source: 'supabase_success'
    })

  } catch (error: any) {
    console.error('💥 ADMIN PROMPTS: Critical error:', error)
    return NextResponse.json(
      { error: 'Failed to delete approved prompts' },
      { status: 500 }
    )
  }
}
