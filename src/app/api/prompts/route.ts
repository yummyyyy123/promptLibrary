// REBUILT: Simple, reliable prompts API with forced Supabase integration
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 REBUILD: Checking environment variables...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    console.log('🔍 Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('🔍 Supabase Key:', supabaseKey ? 'SET' : 'NOT SET')
    
    // FORCE USE SUPABASE - NO FALLBACK
    if (!supabaseUrl || !supabaseKey) {
      console.error('💥 REBUILD: Supabase credentials missing!')
      return NextResponse.json({ 
        error: 'Supabase credentials not configured',
        prompts: [],
        using_supabase: false,
        source: 'error'
      }, { status: 500 })
    }
    
    console.log('📊 REBUILD: Using Supabase database...')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('💥 REBUILD: Supabase error:', error)
      return NextResponse.json({ 
        error: 'Supabase query failed',
        details: error.message,
        prompts: [],
        using_supabase: false,
        source: 'supabase_error'
      }, { status: 500 })
    }
    
    console.log('✅ REBUILD: Supabase success!')
    console.log('📊 REBUILD: Prompts count:', prompts?.length || 0)
    console.log('📊 REBUILD: First prompt:', prompts?.[0]?.title || 'None')
    
    // FORCE RETURN SUPABASE DATA
    return NextResponse.json({ 
      prompts: prompts || [],
      using_supabase: true,
      source: 'supabase_rebuild',
      count: prompts?.length || 0,
      debug: {
        env_check: {
          url_set: !!supabaseUrl,
          key_set: !!supabaseKey
        }
      }
    })
    
  } catch (error: any) {
    console.error('💥 REBUILD: Critical error:', error)
    return NextResponse.json({ 
      error: 'Critical API error',
      details: error.message,
      prompts: [],
      using_supabase: false,
      source: 'critical_error'
    }, { status: 500 })
  }
}

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
        submitted_by: 'anonymous',
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
      prompt: data,
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
