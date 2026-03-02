'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Globe, Key } from 'lucide-react'

interface DebugInfo {
  timestamp: string
  environment: Record<string, string>
  database: {
    status: string
    error: string | null
  }
  security: {
    scriptExists: boolean
    secrets: { status: string; issues: number; details: string }
    dependencies: { status: string; issues: number; details: string }
    typescript: { status: string; issues: number; details: string }
    api: { status: string; issues: number; details: string }
    totalIssues: number
  }
  message: string
}

export default function AdminDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const fetchDebugInfo = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/debug')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setDebugInfo(data)
      
    } catch (error: any) {
      console.error('Debug fetch error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SET':
      case 'CONNECTED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'NOT SET':
      case 'MISSING CREDENTIALS':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'ERROR':
      case 'FAILED':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SET':
      case 'CONNECTED':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'NOT SET':
      case 'MISSING CREDENTIALS':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'ERROR':
      case 'FAILED':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading debug information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Debug Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDebugInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Debug Panel</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">System diagnostics and troubleshooting</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={fetchDebugInfo}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/admin/login')}
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            Environment Variables
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {debugInfo && Object.entries(debugInfo.environment).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2 sm:gap-0">
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base break-words">{key}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(value as string)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value as string)}`}>
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Check Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Security Check Status
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3 sm:gap-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Security Script</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {debugInfo?.security?.scriptExists ? 'Security check script available' : 'Security script not found'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusIcon(debugInfo?.security?.scriptExists ? 'PASS' : 'FAIL')}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(debugInfo?.security?.scriptExists ? 'PASS' : 'FAIL')}`}>
                  {debugInfo?.security?.scriptExists ? 'AVAILABLE' : 'MISSING'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Secret Detection</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.security?.secrets?.status || 'UNKNOWN')}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debugInfo?.security?.secrets?.status || 'UNKNOWN')}`}>
                    {debugInfo?.security?.secrets?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Dependencies</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.security?.dependencies?.status || 'UNKNOWN')}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debugInfo?.security?.dependencies?.status || 'UNKNOWN')}`}>
                    {debugInfo?.security?.dependencies?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">TypeScript</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.security?.typescript?.status || 'UNKNOWN')}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debugInfo?.security?.typescript?.status || 'UNKNOWN')}`}>
                    {debugInfo?.security?.typescript?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">API Security</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.security?.api?.status || 'UNKNOWN')}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debugInfo?.security?.api?.status || 'UNKNOWN')}`}>
                    {debugInfo?.security?.api?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>
            
            {debugInfo?.security?.totalIssues && debugInfo.security.totalIssues > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-2 text-sm sm:text-base">Security Issues:</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Found {debugInfo.security.totalIssues} security issue(s) that need attention
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Database Connection
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-3 sm:gap-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Connection Status</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {debugInfo?.database.status === 'CONNECTED' ? 'Successfully connected to Supabase' : 'Connection failed'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusIcon(debugInfo?.database.status || 'FAILED')}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(debugInfo?.database.status || 'FAILED')}`}>
                  {debugInfo?.database.status || 'UNKNOWN'}
                </span>
              </div>
            </div>
            
            {debugInfo?.database.error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-medium text-red-800 dark:text-red-200 mb-2 text-sm sm:text-base">Error Details:</p>
                <p className="text-sm text-red-600 dark:text-red-400 font-mono break-all">{String(debugInfo.database.error)}</p>
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            System Information
          </h2>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2 sm:gap-0">
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Timestamp</span>
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-all">{debugInfo?.timestamp || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2 sm:gap-0">
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Environment</span>
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{debugInfo?.environment?.NODE_ENV || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
