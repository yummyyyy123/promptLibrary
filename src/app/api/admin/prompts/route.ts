// ADMIN PROMPTS - Manage approved prompts (delete functionality)
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 })
    }

    // Sanitize input data
    const { sanitizeObject } = await import('@/utils/sanitation')
    const sanitizedBody = sanitizeObject(body)

    const { title, description, category, tags, prompt, variables } = sanitizedBody

    if (!title || !description || !category || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        title,
        description,
        category,
        tags: tags || [],
        prompt,
        variables: variables || [],
        usage_count: 0,
        is_favorite: false
      })
      .select()
      .single()

    if (error) {
      console.error('💥 ADMIN: Insert prompt error:', error)
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Prompt created successfully',
      prompt: data
    })
  } catch (error) {
    console.error('💥 ADMIN: POST critical error:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
})

export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 })
    }

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
})

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
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
})

