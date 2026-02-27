import { NextRequest, NextResponse } from 'next/server'
import { PromptSubmission } from '@/types/database'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.json')
const PROMPTS_FILE = path.join(process.cwd(), 'data', 'prompts.json')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Helper functions
function getSubmissions(): PromptSubmission[] {
  try {
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

function saveSubmissions(submissions: PromptSubmission[]) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))
}

function getPrompts() {
  try {
    const data = fs.readFileSync(PROMPTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { prompts: [] }
  }
}

function savePrompts(promptsData: any) {
  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(promptsData, null, 2))
}

// JWT authentication middleware
function authenticate(request: NextRequest): boolean {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return false
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.role === 'admin'
  } catch (error) {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, submissionId, reason } = body

    const submissions = getSubmissions()
    const submissionIndex = submissions.findIndex(s => s.id === submissionId)

    if (submissionIndex === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    const submission = submissions[submissionIndex]

    if (action === 'approve') {
      // Update submission status
      submissions[submissionIndex] = {
        ...submission,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'admin'
      }

      // Add to main prompts database
      const promptsData = getPrompts()
      const newPrompt = {
        id: submission.id,
        title: submission.title,
        description: submission.description,
        category: submission.category,
        tags: submission.tags,
        prompt: submission.prompt,
        variables: submission.variables,
        createdAt: submission.submittedAt,
        usageCount: 0,
        isFavorite: false
      }
      promptsData.prompts.push(newPrompt)
      savePrompts(promptsData)

    } else if (action === 'reject') {
      submissions[submissionIndex] = {
        ...submission,
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'admin',
        rejectionReason: reason || 'Rejected by admin'
      }
    }

    saveSubmissions(submissions)

    return NextResponse.json({
      message: `Submission ${action}d successfully`,
      submission: submissions[submissionIndex]
    })

  } catch (error) {
    console.error('Error managing submission:', error)
    return NextResponse.json(
      { error: 'Failed to manage submission' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let submissions = getSubmissions()

    // Filter by status if provided
    if (status) {
      submissions = submissions.filter(s => s.status === status)
    }

    // Calculate stats
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      thisWeek: submissions.filter(s => {
        const submissionDate = new Date(s.submittedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return submissionDate >= weekAgo
      }).length,
      thisMonth: submissions.filter(s => {
        const submissionDate = new Date(s.submittedAt)
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return submissionDate >= monthAgo
      }).length
    }

    return NextResponse.json({
      submissions,
      stats
    })

  } catch (error) {
    console.error('Error fetching admin data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}
