import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

export async function GET() {
  // If Supabase environment variables are missing, use JSON fallback
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Supabase environment variables not found, using JSON fallback')
    return getPromptsFromJSON()
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      // Fallback to JSON if Supabase fails
      return getPromptsFromJSON()
    }

    return NextResponse.json({ prompts: data || [] })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    // Fallback to JSON if Supabase fails
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
    
    return NextResponse.json(promptsData)
  } catch (error) {
    console.error('Fallback JSON error:', error)
    return NextResponse.json(
      { error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}
