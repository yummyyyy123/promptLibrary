import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'
import path from 'path'

// Supabase configuration
const supabaseUrl = 'https://urqzfyvbkmibwhjlpyyo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycXpmeXZia21pYndoamxweXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE2OTMxOCwiZXhwIjoyMDg3NzQ1MzE4fQ.9k3hC7-d160Ihj7AoqxCLFn4d1wSkN7MAIB9Cdbz4g8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importPromptsToSupabase() {
  try {
    console.log('📖 Reading prompts from JSON file...')
    
    // Read JSON file
    const filePath = path.join(process.cwd(), 'data', 'prompts.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const promptsData = JSON.parse(fileContents)
    
    console.log(`📊 Found ${promptsData.prompts.length} prompts to import`)
    
    // Transform data for Supabase (let Supabase generate UUIDs)
    const supabasePrompts = promptsData.prompts.map(prompt => ({
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags,
      prompt: prompt.prompt,
      variables: prompt.variables,
      created_at: prompt.createdAt || new Date().toISOString(),
      usage_count: prompt.usageCount || 0,
      is_favorite: prompt.isFavorite || false
    }))
    
    console.log('🔄 Inserting prompts into Supabase...')
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('prompts')
      .insert(supabasePrompts)
      .select()
    
    if (error) {
      console.error('❌ Error inserting prompts:', error)
      return
    }
    
    console.log(`✅ Successfully imported ${data?.length || 0} prompts to Supabase!`)
    console.log('🎉 Your prompt library is now ready with Supabase!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

// Run the import
importPromptsToSupabase()
