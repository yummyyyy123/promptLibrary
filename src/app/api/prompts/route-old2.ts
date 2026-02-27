import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking environment variables...')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
    console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET')
    console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? 'SET' : 'NOT SET')
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET')
    
    // Try Supabase first
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      console.log('📊 Using Supabase database...')
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
      
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return getPromptsFromJSON()
      }

      console.log('✅ Supabase success, prompts:', data?.length || 0)
      return NextResponse.json({ prompts: data || [] })
    } else {
      console.log('📁 Using JSON fallback...')
      return getPromptsFromJSON()
    }
  } catch (error) {
    console.error('Error:', error)
    return getPromptsFromJSON()
  }
}

async function getPromptsFromJSON() {
  try {
    const { promises: fs } = await import('fs')
    const path = await import('path')
    
    const filePath = path.join(process.cwd(), 'data', 'prompts.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const promptsData = JSON.parse(fileContents)
    
    console.log('📁 JSON fallback, prompts:', promptsData.prompts?.length || 0)
    return NextResponse.json(promptsData)
  } catch (error) {
    console.error('JSON fallback error:', error)
    return NextResponse.json(
      { error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}
