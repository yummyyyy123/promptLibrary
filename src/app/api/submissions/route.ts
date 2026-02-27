// DEBUG SUBMISSIONS - Show exactly what's happening
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🔍 DEBUG: Submission request received')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    console.log('🔍 DEBUG: Environment variables:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('  - SUPABASE_SERVICE_KEY:', supabaseKey ? 'SET' : 'NOT SET')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('💥 DEBUG: Supabase credentials missing!')
      return NextResponse.json({ 
        error: 'Supabase credentials not configured',
        debug: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          env: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV
        }
      }, { status: 500 })
    }
    
    const body = await request.json()
    console.log('🔍 DEBUG: Request body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'prompt']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      console.error('💥 DEBUG: Missing fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    console.log('🔍 DEBUG: Creating Supabase client...')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 DEBUG: Inserting into Supabase...')
    
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
    
    console.log('🔍 DEBUG: Supabase response:')
    console.log('  - Data:', data)
    console.log('  - Error:', error)
    
    if (error) {
      console.error('💥 DEBUG: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to submit prompt',
        details: error.message,
        debug: {
          supabaseError: error,
          requestBody: body
        }
      }, { status: 500 })
    }
    
    console.log('✅ DEBUG: Submission successful!')
    
    return NextResponse.json({
      message: 'Prompt submitted successfully',
      submission: data,
      debug: {
        success: true,
        insertedId: data?.id
      }
    })
    
  } catch (error: any) {
    console.error('💥 DEBUG: Critical error:', error)
    console.error('💥 DEBUG: Error stack:', error.stack)
    
    return NextResponse.json({ 
      error: 'Failed to submit prompt',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    }, { status: 500 })
  }
}
