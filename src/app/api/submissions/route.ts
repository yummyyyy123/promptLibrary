import { NextRequest, NextResponse } from 'next/server'
import { PromptSubmission } from '@/types/database'
import fs from 'fs'
import path from 'path'

// File-based database for submissions
const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.json')

// Initialize submissions file if it doesn't exist
function ensureSubmissionsFile() {
  if (!fs.existsSync(path.dirname(SUBMISSIONS_FILE))) {
    fs.mkdirSync(path.dirname(SUBMISSIONS_FILE), { recursive: true })
  }
  
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2))
  }
}

// Read submissions from file
function getSubmissions(): PromptSubmission[] {
  ensureSubmissionsFile()
  try {
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write submissions to file
function saveSubmissions(submissions: PromptSubmission[]) {
  ensureSubmissionsFile()
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'tags', 'prompt', 'variables', 'submittedBy']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create new submission
    const submission: PromptSubmission = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [body.tags],
      prompt: body.prompt,
      variables: Array.isArray(body.variables) ? body.variables : [body.variables],
      status: 'pending',
      submittedBy: body.submittedBy,
      submittedAt: new Date().toISOString(),
      usageCount: 0,
      isFavorite: false
    }

    // Save submission
    const submissions = getSubmissions()
    submissions.push(submission)
    saveSubmissions(submissions)

    return NextResponse.json({
      message: 'Prompt submitted successfully',
      submission
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to submit prompt' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const submittedBy = searchParams.get('submittedBy')

    let submissions = getSubmissions()

    // Filter by status if provided
    if (status) {
      submissions = submissions.filter(s => s.status === status)
    }

    // Filter by submitter if provided
    if (submittedBy) {
      submissions = submissions.filter(s => s.submittedBy === submittedBy)
    }

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
