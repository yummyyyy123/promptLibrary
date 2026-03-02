'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Globe, Key, Activity, Play, ChevronRight, X, Zap, GitBranch, Server, Bug, TestTube, CheckSquare } from 'lucide-react'
import AdminAuthCheck from '@/components/AdminAuthCheck'

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
  const [commandOutput, setCommandOutput] = useState<string | null>(null)
  const [isRunningCommand, setIsRunningCommand] = useState(false)
  const [runningCommand, setRunningCommand] = useState<string>('')
  const [vulnerabilityData, setVulnerabilityData] = useState<any>(null)
  const [isLoadingVulnerabilities, setIsLoadingVulnerabilities] = useState(false)
  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [fixOutput, setFixOutput] = useState<string | null>(null)
  const router = useRouter()

  const fetchVulnerabilityIntelligence = async () => {
    setIsLoadingVulnerabilities(true)
    try {
      const response = await fetch('/api/admin/vulnerability-intelligence')
      if (response.ok) {
        const data = await response.json()
        setVulnerabilityData(data)
      }
    } catch (error) {
      console.error('Failed to fetch vulnerability intelligence:', error)
    } finally {
      setIsLoadingVulnerabilities(false)
    }
  }

  const applySecurityFix = async (action: string, packageName?: string) => {
    setIsApplyingFix(true)
    setFixOutput(null)

    try {
      const response = await fetch('/api/admin/security-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          package: packageName
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFixOutput(JSON.stringify(data, null, 2))

        // Refresh vulnerability data after fix
        await fetchVulnerabilityIntelligence()
        await fetchDebugInfo()
      }
    } catch (error: any) {
      setFixOutput(`Error: ${error.message}`)
    } finally {
      setIsApplyingFix(false)
    }
  }

  const runSecurityCommand = async (command: string) => {
    setIsRunningCommand(true)
    setRunningCommand(command)
    setCommandOutput(null)

    try {
      const response = await fetch('/api/admin/security-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCommandOutput(data.output || data.error || 'Command completed')
    } catch (error: any) {
      setCommandOutput(`Error: ${error.message}`)
    } finally {
      setIsRunningCommand(false)
      setRunningCommand('')
    }
  }

  useEffect(() => {
    fetchDebugInfo()
    fetchVulnerabilityIntelligence()
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
    <>
      <AdminAuthCheck />
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
                  onClick={() => router.push('/admin')}
                  className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Back to Admin
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

          {/* Security Testing Commands */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Security Testing Commands
            </h2>
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => runSecurityCommand('full')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run Full Security Suite
                </button>
                <button
                  onClick={() => runSecurityCommand('quick')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Quick Security Check
                </button>
                <button
                  onClick={() => fetchDebugInfo()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
              </div>

              {/* Individual Commands Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => runSecurityCommand('check')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Security Check</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pre-commit validation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('audit')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dependency Audit</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Check vulnerabilities</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-600 group-hover:text-amber-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('secrets')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Secret Detection</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Scan for secrets</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('env')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Environment Check</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Validate env vars</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('test')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Security Tests</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Run test suite</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('deps')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dependency Fix</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Auto-fix vulnerabilities</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('lint')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Code Linting</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ESLint validation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-cyan-600 group-hover:text-cyan-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('typecheck')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Type Check</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">TypeScript validation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-orange-600 group-hover:text-orange-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('build')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Build Test</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Production build</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-pink-600 group-hover:text-pink-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                {/* QA Tool Additions */}
                <button
                  onClick={() => runSecurityCommand('jest')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Unit Tests</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Run QA suite</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-fuchsia-600 group-hover:text-fuchsia-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => runSecurityCommand('qa')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">QA Sanity Check</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Full end-to-end mock</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-teal-600 group-hover:text-teal-700" />
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* Command Output */}
              {commandOutput && (
                <div className="mt-4 p-4 bg-gray-900 dark:bg-black rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-300 text-sm">Command Output:</p>
                    <button
                      onClick={() => setCommandOutput(null)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                    {commandOutput}
                  </pre>
                </div>
              )}

              {/* Running Status */}
              {isRunningCommand && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                      Running security command: {runningCommand}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Threat Intelligence */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Threat Intelligence
            </h2>
            <div className="space-y-4">
              {/* Security Health Score */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Security Health Score</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${vulnerabilityData?.securityHealthScore >= 80 ? 'bg-green-500' : vulnerabilityData?.securityHealthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                    <span className={`text-lg font-bold ${vulnerabilityData?.securityHealthScore >= 80 ? 'text-green-600' : vulnerabilityData?.securityHealthScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {vulnerabilityData?.securityHealthScore || 0}/100
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${vulnerabilityData?.securityHealthScore >= 80 ? 'bg-green-500' : vulnerabilityData?.securityHealthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${vulnerabilityData?.securityHealthScore || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Vulnerability Alerts */}
              {vulnerabilityData?.vulnerablePackages && vulnerabilityData.vulnerablePackages.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Active Vulnerabilities</h3>
                  {vulnerabilityData.vulnerablePackages.slice(0, 3).map((vuln: any, index: number) => (
                    <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800 dark:text-red-200">
                              {vuln.affectedPackage} v{vuln.currentVersion}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${vuln.cvssScore >= 9.0 ? 'bg-red-100 text-red-800' :
                              vuln.cvssScore >= 7.0 ? 'bg-orange-100 text-orange-800' :
                                vuln.cvssScore >= 4.0 ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                            {vuln.advisory.summary}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                            CVSS Score: {vuln.cvssScore} | {vuln.recommendedAction}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => applySecurityFix('update-package', vuln.affectedPackage)}
                          disabled={isApplyingFix}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {isApplyingFix ? 'Applying...' : 'Apply Fix'}
                        </button>
                        <button
                          onClick={() => fetchVulnerabilityIntelligence()}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  ))}

                  {vulnerabilityData.vulnerablePackages.length > 3 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ... and {vulnerabilityData.vulnerablePackages.length - 3} more vulnerabilities
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">No vulnerabilities detected</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Your dependencies are currently secure
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applySecurityFix('update-all')}
                  disabled={isApplyingFix}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Apply Security Patches
                </button>
                <button
                  onClick={() => applySecurityFix('audit-fix')}
                  disabled={isApplyingFix}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Run Audit Fix
                </button>
                <button
                  onClick={() => fetchVulnerabilityIntelligence()}
                  disabled={isLoadingVulnerabilities}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" />
                  {isLoadingVulnerabilities ? 'Scanning...' : 'Scan for Vulnerabilities'}
                </button>
              </div>

              {/* Fix Output */}
              {fixOutput && (
                <div className="mt-4 p-4 bg-gray-900 dark:bg-black rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-300 text-sm">Security Fix Output:</p>
                    <button
                      onClick={() => setFixOutput(null)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                    {fixOutput}
                  </pre>
                </div>
              )}

              {/* Applying Fix Status */}
              {isApplyingFix && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                      Applying security fixes...
                    </p>
                  </div>
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
    </>
  )
}
