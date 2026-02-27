// FIXED SUBMISSIONS - Use correct database schema
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🔍 FIXED: Submission request received')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('💥 FIXED: Supabase credentials missing!')
      return NextResponse.json({ 
        error: 'Supabase credentials not configured'
      }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('🔍 FIXED: Request body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'prompt']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.error('💥 FIXED: Missing fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 FIXED: Inserting into SUBMISSIONS table (not prompts)...')
    
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
    
    console.log('🔍 FIXED: Supabase response:')
    console.log('  - Data:', data)
    console.log('  - Error:', error)
    
    if (error) {
      console.error('💥 FIXED: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to submit prompt',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ FIXED: Submission successful!')
    
    return NextResponse.json({
      message: 'Prompt submitted successfully',
      submission: data
    })
    
  } catch (error: any) {
    console.error('💥 FIXED: Critical error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit prompt',
      details: error.message
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
    
    console.log('🔍 FIXED: Fetching from SUBMISSIONS table...')
    
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
      console.error('💥 FIXED: GET SUBMISSIONS error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        submissions: []
      }, { status: 500 })
    }
    
    console.log('✅ FIXED: Submissions fetched:', submissions?.length || 0)
    
    return NextResponse.json({ submissions: submissions || [] })
    
  } catch (error: any) {
    console.error('💥 FIXED: GET critical error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      submissions: []
    }, { status: 500 })
  }
}
