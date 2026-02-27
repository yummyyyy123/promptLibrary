// SUBMISSIONS API - Secure implementation with OWASP protections
import { NextResponse } from 'next/server'
import { validateInput, SecurityLogger, secureAPI } from '@/lib/security'

export const POST = secureAPI(async (request: Request) => {
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
    
    // Validate all inputs
    const validatedData = {
      title: validateInput(body.title, 'text'),
      description: validateInput(body.description, 'text'),
      category: validateInput(body.category, 'category'),
      tags: Array.isArray(body.tags) ? body.tags.map((tag: string) => validateInput(tag, 'text')) : [],
      prompt: validateInput(body.prompt, 'prompt'),
      variables: Array.isArray(body.variables) ? body.variables.map((variable: string) => validateInput(variable, 'text')) : [],
      submitted_by: validateInput(body.submittedBy || 'anonymous', 'text')
    }
    
    console.log('🔍 SUBMISSION: Validated data:', validatedData)
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 SUBMISSION: Inserting into SUBMISSIONS table...')
    
    // Insert into SUBMISSIONS table (not prompts table)
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        tags: validatedData.tags,
        prompt: validatedData.prompt,
        variables: validatedData.variables,
        status: 'pending',
        submitted_by: validatedData.submitted_by
      })
      .select()
      .single()
    
    console.log('🔍 SUBMISSION: Supabase response:')
    console.log('  - Data:', data)
    console.log('  - Error:', error)
    
    if (error) {
      console.error('💥 SUBMISSION: Supabase error:', error)
      SecurityLogger.log('error', 'submission_database_error', { error: error.message })
      return NextResponse.json({ 
        error: 'Failed to submit prompt',
        details: error.message,
        source: 'supabase_error'
      }, { status: 500 })
    }
    
    console.log('✅ SUBMISSION: Success!')
    
    SecurityLogger.log('info', 'submission_successful', { 
      submissionId: data.id,
      title: data.title,
      category: data.category
    })
    
    return NextResponse.json({
      message: 'Prompt submitted successfully',
      submission: data,
      source: 'supabase_success'
    })
    
  } catch (error: any) {
    console.error('💥 SUBMISSION: Critical error:', error)
    SecurityLogger.log('error', 'submission_critical_error', { 
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Failed to submit prompt',
      details: error.message,
      source: 'critical_error'
    }, { status: 500 })
  }
})

export const GET = secureAPI(async (request: Request) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('💥 SUBMISSION: Supabase credentials missing!')
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
      SecurityLogger.log('error', 'submissions_fetch_error', { error: error.message })
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        submissions: []
      }, { status: 500 })
    }
    
    console.log('✅ SUBMISSIONS: Fetched:', submissions?.length || 0)
    
    return NextResponse.json({ submissions: submissions || [] })
    
  } catch (error: any) {
    console.error('💥 SUBMISSIONS: Critical error:', error)
    SecurityLogger.log('error', 'submissions_critical_error', { 
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      submissions: []
    }, { status: 500 })
  }
})
