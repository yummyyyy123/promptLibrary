// SUBMISSIONS API - Simple working version
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
    console.log('🔍 SUBMISSION: Request body:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'prompt']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.error('💥 SUBMISSION: Missing fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 SUBMISSION: Inserting into SUBMISSIONS table...')
    
    // Insert into SUBMISSIONS table (not prompts table)
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        tags: body.tags || [],
        prompt: body.prompt,
        variables: body.variables || [],
        status: 'pending',
        submitted_by: body.submittedBy || 'anonymous'
      })
      .select()
      .single()
    
    console.log('🔍 SUBMISSION: Supabase response:')
    console.log('  - Data:', data)
    console.log('  - Error:', error)
    
    if (error) {
      console.error('💥 SUBMISSION: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to submit prompt',
        details: error.message,
        source: 'supabase_error'
      }, { status: 500 })
    }
    
    console.log('✅ SUBMISSION: Success!')
    
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
    
    console.log('🔍 SUBMISSIONS: Fetching from SUBMISSIONS table...')
    
    let query = supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: submissions, error } = await query
    
    if (error) {
      console.error('💥 SUBMISSIONS: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        submissions: []
      }, { status: 500 })
    }
    
    console.log('✅ SUBMISSIONS: Fetched:', submissions?.length || 0)
    
    return NextResponse.json({ submissions: submissions || [] })
    
  } catch (error: any) {
    console.error('💥 SUBMISSIONS: Critical error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      submissions: []
    }, { status: 500 })
  }
}
