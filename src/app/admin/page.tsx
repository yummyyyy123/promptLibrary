'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Check, X, Eye, TrendingUp, Clock, Users, FileText, Filter, ChevronDown, LogOut, Shield, AlertCircle } from 'lucide-react'
import { PromptSubmission, SubmissionStats } from '@/types/database'
import { useRouter } from 'next/navigation'
import { requireAuth } from '@/lib/auth-utils'

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

  useEffect(() => {
    // Check authentication
    requireAuth()
  }, [router])

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
        setShowRejectModal(false)
        setRejectionReason('')
        setRejectionId('')
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error rejecting submission:', error)
    }
  }

  const openRejectModal = (submissionId: string) => {
    setRejectionId(submissionId)
    setShowRejectModal(true)
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
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus
    const matchesSearch = submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         submission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         submission.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.thisWeek}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubmissions.map((submission, index) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {submission.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {submission.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {submission.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {submission.submittedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(submission.id)}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(submission.id)}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedSubmission(null)}
        >
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedSubmission.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                        {selectedSubmission.status}
                      </span>
                      <span>By: {selectedSubmission.submittedBy}</span>
                      <span>{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedSubmission.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Prompt</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                        {selectedSubmission.prompt}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Variables</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-full text-sm"
                        >
                          [{variable}]
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedSubmission.rejectionReason && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Rejection Reason</h3>
                      <p className="text-red-600 dark:text-red-400">{selectedSubmission.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedSubmission.status === 'pending' && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedSubmission.id)}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(selectedSubmission.id)}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowRejectModal(false)}
        >
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Submission</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Please provide a reason for rejecting this submission..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
