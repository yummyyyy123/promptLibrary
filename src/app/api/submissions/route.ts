// Submissions API - Handle prompt submissions with Supabase integration
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🔍 SUBMISSION: New prompt submission...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('💥 SUBMISSION: Supabase credentials missing!')
      return NextResponse.json({ 
        error: 'Supabase credentials not configured',
        source: 'error'
      }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('🔍 SUBMISSION: Received data:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'prompt']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Insert into prompts table
    const { data, error } = await supabase
      .from('prompts')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
        prompt: body.prompt,
        variables: body.variables || [],
        status: 'pending',
        submitted_by: body.submittedBy || 'anonymous',
        usage_count: 0,
        is_favorite: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('💥 SUBMISSION: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to submit prompt',
        details: error.message,
        source: 'supabase_error'
      }, { status: 500 })
    }
    
    console.log('✅ SUBMISSION: Success!', data)
    
    return NextResponse.json({
      message: 'Prompt submitted successfully',
      submission: data,
      source: 'supabase_success'
    })
    
  } catch (error: any) {
    console.error('💥 SUBMISSION: Critical error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit prompt',
      details: error.message,
      source: 'critical_error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase credentials not configured',
        submissions: []
      }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let query = supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: submissions, error } = await query
    
    if (error) {
      console.error('💥 GET SUBMISSIONS: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        submissions: []
      }, { status: 500 })
    }
    
    return NextResponse.json({ submissions: submissions || [] })
    
  } catch (error: any) {
    console.error('💥 GET SUBMISSIONS: Critical error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      submissions: []
    }, { status: 500 })
  }
}
