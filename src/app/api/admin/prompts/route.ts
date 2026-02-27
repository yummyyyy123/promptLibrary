// ADMIN PROMPTS - Manage approved prompts (delete functionality)
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

    const body = await request.json()
    const { promptId } = body

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
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

    console.log('🔍 ADMIN PROMPTS: Deleting prompt:', promptId)

    // Delete from prompts table
    const { data, error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .select()
      .single()

    if (error) {
      console.error('💥 ADMIN PROMPTS: Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      )
    }

    console.log('✅ ADMIN PROMPTS: Delete successful:', data)

    return NextResponse.json({
      message: 'Prompt deleted successfully',
      deletedPrompt: data
    })

  } catch (error: any) {
    console.error('💥 ADMIN PROMPTS: Critical error:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    console.log('🔍 ADMIN PROMPTS: Fetching approved prompts...')

    // Get all approved prompts
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('💥 ADMIN PROMPTS: Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    console.log('✅ ADMIN PROMPTS: Fetched prompts:', prompts?.length || 0)

    return NextResponse.json({
      prompts: prompts || []
    })

  } catch (error: any) {
    console.error('💥 ADMIN PROMPTS: Critical error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}
