// ADMIN SUBMISSIONS - Use Supabase database
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'

export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('💥 ADMIN: Delete submission error:', error)
      return NextResponse.json(
        { error: 'Failed to delete submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Submission deleted successfully',
      submission: data
    })
  } catch (error) {
    console.error('💥 ADMIN: DELETE critical error:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 })
    }

    const { action, submissionId, reason } = body

    if (!action || !submissionId) {
      return NextResponse.json({ error: 'Action and submission ID required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (action === 'approve') {
      // Update submission status to approved
      const { data: submission, error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          reviewed_by: 'admin',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single()

      if (updateError) {
        console.error('💥 ADMIN: Update submission error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        )
      }

      // Move to prompts table
      const { data: prompt, error: insertError } = await supabase
        .from('prompts')
        .insert({
          title: submission.title,
          description: submission.description,
          category: submission.category,
          tags: submission.tags,
          prompt: submission.prompt,
          variables: submission.variables,
          usage_count: 0,
          is_favorite: false
        })
        .select()
        .single()

      if (insertError) {
        console.error('💥 ADMIN: Insert prompt error:', insertError)
        return NextResponse.json(
          { error: 'Failed to add to prompts' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Submission approved successfully',
        submission,
        prompt
      })

    } else if (action === 'reject') {
      // Update submission status to rejected
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          reviewed_by: 'admin',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || 'Rejected by admin'
        })
        .eq('id', submissionId)
        .select()
        .single()

      if (error) {
        console.error('💥 ADMIN: Reject submission error:', error)
        return NextResponse.json(
          { error: 'Failed to reject submission' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Submission rejected successfully',
        submission: data
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('💥 ADMIN: Critical error:', error)
    return NextResponse.json(
      { error: 'Failed to manage submission' },
      { status: 500 }
    )
  }
})

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get ALL submissions first, then filter if status provided
    let query = supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    const { data: allSubmissions, error: fetchError } = await query

    if (fetchError) {
      console.error('💥 ADMIN: Fetch submissions error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    // Filter by status if provided (for filtering)
    let submissions = allSubmissions || []
    if (status) {
      submissions = submissions.filter(s => s.status === status)
    }

    // Calculate stats
    const stats = {
      total: submissions?.length || 0,
      pending: submissions?.filter(s => s.status === 'pending').length || 0,
      approved: submissions?.filter(s => s.status === 'approved').length || 0,
      rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
      thisWeek: submissions?.filter(s => {
        const submissionDate = new Date(s.submitted_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return submissionDate >= weekAgo
      }).length || 0,
      thisMonth: submissions?.filter(s => {
        const submissionDate = new Date(s.submitted_at)
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return submissionDate >= monthAgo
      }).length || 0
    }

    return NextResponse.json({
      submissions: submissions || [],
      stats
    })

  } catch (error) {
    console.error('💥 ADMIN: GET critical error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
})

