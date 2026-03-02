'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Activity, Shield, Zap, GitBranch, Clock, RefreshCw, AlertCircle as AlertIcon, Info, Bug, Lock, FileText, Play, ChevronRight, X, Terminal } from 'lucide-react'

interface TestResults {
  timestamp: string
  tests: Array<{
    name: string
    status: string
    details: string
    severity: string
    components?: any
  }>
  pipeline: {
    smoke: any
    security: any
    performance: any
    integration: any
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    securityScore: number
    performanceScore: number
    overallStatus: any
  }
  duration: number
}

interface IssueDetail {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  component: string
  recommendation: string
}

export default function TestPage() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string>('')
  const [issues, setIssues] = useState<IssueDetail[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'performance' | 'details'>('overview')
  const [commandOutput, setCommandOutput] = useState<string | null>(null)
  const [isRunningCommand, setIsRunningCommand] = useState(false)
  const [runningCommand, setRunningCommand] = useState<string>('')

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

  const runTests = async (testType: 'smoke' | 'security' | 'performance' | 'all') => {
    setLoading(true)
    setIssues([])
    setCommandOutput(null)
    
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Starting ${testType} tests...`)
      const response = await fetch(`/api/test/${testType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`📋 Response data:`, data)
      
      if (testType === 'all') {
        const allResults = {
          ...data.results,
          tests: data.results?.tests || []
        }
        setResults(allResults)
        analyzeIssues(allResults)
      } else {
        // Mock structure for individual tests
        const mockResults = {
          timestamp: data.timestamp || new Date().toISOString(),
          tests: data.results?.tests || [],
          pipeline: {
            smoke: testType === 'smoke' ? data.results : null,
            security: testType === 'security' ? data.results : null,
            performance: null,
            integration: null
          },
          summary: {
            totalTests: data.results?.summary?.total || 0,
            passedTests: data.results?.summary?.passed || 0,
            failedTests: data.results?.summary?.failed || 0,
            securityScore: data.securityScore || 0,
            performanceScore: 0,
            overallStatus: data.status || 'UNKNOWN'
          },
          duration: 0
        }
        setResults(mockResults)
        analyzeIssues(mockResults)
      }
      
      setLastRun(new Date().toLocaleTimeString())
      console.log(`✅ Tests completed successfully`)
    } catch (error) {
      console.error('❌ Test error:', error)
      
      // Show user-friendly error
      if (error instanceof Error) {
        alert(`Test failed: ${error.message}`)
      } else {
        alert('Test failed: Unknown error occurred')
      }
    } finally {
      setLoading(false)
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      if (results) {
        setResults({ ...results, duration: parseFloat(duration) })
      }
    }
  }

  const analyzeIssues = (testResults: TestResults) => {
    const foundIssues: IssueDetail[] = []
    
    // Analyze test results for issues
    testResults.tests.forEach(test => {
      if (test.status === 'FAIL' || test.status === 'ERROR') {
        foundIssues.push({
          type: test.name,
          severity: test.severity === 'HIGH' ? 'high' : 'medium',
          description: test.details,
          component: 'Test Suite',
          recommendation: `Review ${test.name} implementation and fix identified issues`
        })
      }
    })
    
    // Add security-specific issues
    if (testResults.pipeline.security) {
      const securityTests = testResults.pipeline.security.tests || []
      securityTests.forEach((test: any) => {
        if (test.status === 'FAIL') {
          foundIssues.push({
            type: 'Security',
            severity: 'high',
            description: test.details,
            component: 'Security Module',
            recommendation: 'Address security vulnerability immediately'
          })
        }
      })
    }
    
    setIssues(foundIssues)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'WARN':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      default:
        return <AlertIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'FAIL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'WARN':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  useEffect(() => {
    // Auto-run security tests on page load
    runTests('security')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-emerald-600" />
            Security Testing Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Comprehensive security validation and testing suite for your application
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8 justify-center"
        >
          <button
            onClick={() => runTests('security')}
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-5 h-5" />
            Run Security Tests
          </button>
          <button
            onClick={() => runTests('all')}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Run All Tests
          </button>
          <button
            onClick={() => runSecurityCommand('full')}
            disabled={isRunningCommand}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            Full Security Suite
          </button>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Running security tests...</p>
          </motion.div>
        )}

        {/* Results */}
        {results && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tests</h3>
                  <GitBranch className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{results.summary.totalTests}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Passed</h3>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{results.summary.passedTests}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Failed</h3>
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{results.summary.failedTests}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Duration</h3>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{results.duration}s</p>
              </motion.div>
            </div>

            {/* Security Check Script Status */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Security Check Script Status
              </h2>
              <div className="space-y-3">
                {results.tests.find((test: any) => test.name === 'Security Check Script') ? (
                  (() => {
                    const securityTest = results.tests.find((test: any) => test.name === 'Security Check Script')
                    if (!securityTest) return null
                    
                    return (
                      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Security Script Status</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(securityTest.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(securityTest.status)}`}>
                              {securityTest.status}
                            </span>
                          </div>
                        </div>
                        
                        {securityTest.components && (
                          <div className="space-y-2 mb-3">
                            {Object.entries(securityTest.components).map(([key, component]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-2 bg-white dark:bg-slate-600 rounded">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(component.status)}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}>
                                    {component.status}
                                  </span>
                                  {component.issues > 0 && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                      ({component.issues})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <p className="font-medium mb-1">Details:</p>
                          <p className="text-xs font-mono bg-slate-100 dark:bg-slate-600 p-2 rounded">
                            {securityTest.details}
                          </p>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Security Check Script Not Tested</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Run the security test suite to check script status
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Command Output */}
            {commandOutput && (
              <div className="bg-slate-900 dark:bg-black rounded-xl shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Command Output
                  </h3>
                  <button
                    onClick={() => setCommandOutput(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                  {commandOutput}
                </pre>
              </div>
            )}

            {/* Running Status */}
            {isRunningCommand && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    Running security command: {runningCommand}
                  </p>
                </div>
              </div>
            )}

            {/* Last Run Info */}
            {lastRun && (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                Last run: {lastRun}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
