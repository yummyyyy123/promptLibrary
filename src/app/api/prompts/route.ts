import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'prompts.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const promptsData = JSON.parse(fileContents)
    
    return NextResponse.json(promptsData)
  } catch (error) {
    console.error('Error reading prompts data:', error)
    return NextResponse.json(
      { error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}
