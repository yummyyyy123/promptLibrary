'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Check, X, Eye, TrendingUp, Clock, Users, FileText, Filter, ChevronDown, LogOut, Shield, AlertCircle } from 'lucide-react'
import { PromptSubmission, SubmissionStats } from '@/types/database'
import { useRouter } from 'next/navigation'
import AdminAuthCheck from '@/components/AdminAuthCheck'

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState<PromptSubmission[]>([])
  const [stats, setStats] = useState<SubmissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<PromptSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionId, setRejectionId] = useState('')
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()
      setSubmissions(data.submissions)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'approve',
          submissionId
        })
      })

      if (response.ok) {
        fetchData()
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error approving submission:', error)
    }
  }

  const handleReject = async () => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reject',
          submissionId: rejectionId,
          reason: rejectionReason
        })
      })

      if (response.ok) {
        fetchData()
        setSelectedSubmission(null)
        setShowRejectModal(false)
        setRejectionReason('')
        setRejectionId('')
      }
    } catch (error) {
      console.error('Error rejecting submission:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin/login')
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus === 'all') return true
    return submission.status === filterStatus
  }).filter(submission => 
    submission.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <AdminAuthCheck />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage prompt submissions</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-emerald-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                  </div>
                  <X className="w-8 h-8 text-red-500" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-t-2 border-l-2 border-emerald-500"></div>
            </div>
          )}

          {/* Submissions List */}
          {!loading && filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No submissions found</p>
            </div>
          )}

          {!loading && filteredSubmissions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search submissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{submission.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{submission.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                            {submission.category}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{submission.prompt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(submission.id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setRejectionId(submission.id)
                            setShowRejectModal(true)
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reject Submission</h3>
              <button
                onClick={() => {
                  setSelectedSubmission(null)
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectionId('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-gray-900 dark:text-white">{selectedSubmission.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  {selectedSubmission.category}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prompt</p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedSubmission.prompt}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedSubmission(null)
                  setRejectionReason('')
                  setRejectionId('')
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Submission
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
