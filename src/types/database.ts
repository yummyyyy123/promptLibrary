// Database schema for prompt submissions and admin management

export interface PromptSubmission {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  prompt: string
  variables: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedBy: string
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  usageCount?: number
  isFavorite?: boolean
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'super_admin'
  createdAt: string
  lastLogin?: string
}

export interface SubmissionStats {
  total: number
  pending: number
  approved: number
  rejected: number
  thisWeek: number
  thisMonth: number
}
