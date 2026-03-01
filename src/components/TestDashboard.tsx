'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Activity, Shield, Zap, GitBranch, Clock, RefreshCw, AlertCircle as AlertIcon, Info, Bug, Lock } from 'lucide-react'

interface TestResults {
  timestamp: string
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
    overallStatus: string
  }
  duration: number
}

interface IssueDetail {
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  test: string
  recommendation: string
}

export default function TestDashboard() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string>('')
  const [issues, setIssues] = useState<IssueDetail[]>([])

  const runTests = async (testType: 'all' | 'smoke' | 'security' | 'pipeline' = 'all') => {
    setLoading(true)
    try {
      console.log(`🧪 Running ${testType} tests...`)
      const endpoint = testType === 'all' ? '/api/test/pipeline' : `/api/test/${testType}`
      console.log(`📍 Endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`📋 Response data:`, data)
      
      if (testType === 'all') {
        setResults(data.results)
        analyzeIssues(data.results)
      } else {
        // Mock structure for individual tests
        const mockResults = {
          timestamp: data.timestamp || new Date().toISOString(),
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
    }
  }

  // Analyze test results to identify specific issues
  const analyzeIssues = (testResults: TestResults) => {
    const identifiedIssues: IssueDetail[] = []

    // Analyze security issues
    if (testResults.pipeline.security) {
      if (testResults.pipeline.security.securityScore < 100) {
        identifiedIssues.push({
          type: 'critical',
          title: 'Security Vulnerability Detected',
          description: `Security score is ${testResults.pipeline.security.securityScore}%`,
          test: 'Security Tests',
          recommendation: 'Review security headers and rate limiting configuration'
        })
      }
      
      if (testResults.pipeline.security.failed > 0) {
        identifiedIssues.push({
          type: 'warning',
          title: 'Security Test Failure',
          description: `${testResults.pipeline.security.failed} security tests failed`,
          test: 'Security Tests',
          recommendation: 'Check rate limiting, input validation, and brute force protection'
        })
      }
    }

    // Analyze integration issues
    if (testResults.pipeline.integration) {
      if (testResults.pipeline.integration.failed > 0) {
        identifiedIssues.push({
          type: 'critical',
          title: 'Integration Test Failure',
          description: `${testResults.pipeline.integration.failed} integration tests failed`,
          test: 'Integration Tests',
          recommendation: 'Check API endpoints and authentication flow'
        })
        
        // Add specific integration issues
        if (testResults.pipeline.integration.tests) {
          testResults.pipeline.integration.tests.forEach((test: any) => {
            if (test.status === 'FAIL') {
              identifiedIssues.push({
                type: 'warning',
                title: `Failed: ${test.name}`,
                description: test.details,
                test: 'Integration Tests',
                recommendation: 'Fix the specific test failure'
              })
            }
          })
        }
      }
    }

    // Analyze performance issues
    if (testResults.pipeline.performance) {
      if (testResults.pipeline.performance.performanceScore < 100) {
        identifiedIssues.push({
          type: 'warning',
          title: 'Performance Issue',
          description: `Performance score is ${testResults.pipeline.performance.performanceScore}%`,
          test: 'Performance Tests',
          recommendation: 'Optimize API response times and database queries'
        })
      }
      
      if (testResults.pipeline.performance.avgResponseTime > 500) {
        identifiedIssues.push({
          type: 'info',
          title: 'Slow Response Time',
          description: `Average response time: ${testResults.pipeline.performance.avgResponseTime}ms`,
          test: 'Performance Tests',
          recommendation: 'Consider caching and optimization strategies'
        })
      }
    }

    // Analyze overall issues
    if (testResults.summary.failedTests > 0) {
      identifiedIssues.push({
        type: 'critical',
        title: 'Test Failures Detected',
        description: `${testResults.summary.failedTests} out of ${testResults.summary.totalTests} tests failed`,
        test: 'Overall',
        recommendation: 'Review and fix all failing tests before production deployment'
      })
    }

    if (testResults.summary.securityScore < 90) {
      identifiedIssues.push({
        type: 'warning',
        title: 'Security Score Below Optimal',
        description: `Security score: ${testResults.summary.securityScore}% (Target: 90%+)`,
        test: 'Overall',
        recommendation: 'Implement additional security measures'
      })
    }

    setIssues(identifiedIssues)
  }

  // Simple test function to verify API is working
  const testAPI = async () => {
    try {
      console.log('🔍 Testing API connectivity...')
      const response = await fetch('/api/test/smoke')
      console.log('📊 Smoke test response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Smoke test data:', data)
        alert('API is working! Check console for details.')
      } else {
        alert(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ API test error:', error)
      alert('API test failed. Check console for details.')
    }
  }

  useEffect(() => {
    runTests('pipeline')
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'ALL_TESTS_PASSED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'FAIL':
      case 'CRITICAL_ISSUES':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PARTIALLY_PASSED':
      case 'MOSTLY_PASSED':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'ALL_TESTS_PASSED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'FAIL':
      case 'CRITICAL_ISSUES':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'PARTIALLY_PASSED':
      case 'MOSTLY_PASSED':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 font-bold'
    if (score >= 70) return 'text-amber-600 font-bold'
    return 'text-red-600 font-bold'
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <AlertIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-amber-200 bg-amber-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading test results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Testing Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Automated testing pipeline with real-time issue detection
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Last run</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{lastRun || 'Never'}</p>
              </div>
              <button
                onClick={testAPI}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all disabled:opacity-50 font-medium"
              >
                <Activity className="w-4 h-4" />
                Test API
              </button>
              <button
                onClick={() => runTests('all')}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 font-medium shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Run All Tests
              </button>
            </div>
          </div>
        </div>

        {/* Issues Alert */}
        {issues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertIcon className="w-6 h-6 text-amber-600" />
              Issues Detected ({issues.length})
            </h2>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-l-4 p-4 rounded-lg ${getIssueColor(issue.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{issue.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-full font-medium text-slate-700 dark:text-slate-300">
                          {issue.test}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          💡 {issue.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Tests</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{results.summary.totalTests}</p>
              </div>
              <GitBranch className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Passed</p>
                <p className="text-3xl font-bold text-emerald-600">{results.summary.passedTests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Failed</p>
                <p className="text-3xl font-bold text-red-600">{results.summary.failedTests}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{results.duration}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smoke Tests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Smoke Tests</h2>
              </div>
              {results.pipeline.smoke && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.smoke.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(results.pipeline.smoke.status)}`}>
                    {results.pipeline.smoke.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.smoke && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Passed</span>
                  <span className="font-bold text-emerald-600">{results.pipeline.smoke.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Failed</span>
                  <span className="font-bold text-red-600">{results.pipeline.smoke.failed}</span>
                </div>
                <button
                  onClick={() => runTests('smoke')}
                  disabled={loading}
                  className="w-full mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
                >
                  Run Smoke Tests
                </button>
              </div>
            )}
          </div>

          {/* Security Tests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Tests</h2>
              </div>
              {results.pipeline.security && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.security.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(results.pipeline.security.status)}`}>
                    {results.pipeline.security.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.security && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Security Score</span>
                  <span className={`font-bold ${getScoreColor(results.pipeline.security.securityScore)}`}>
                    {results.pipeline.security.securityScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Passed</span>
                  <span className="font-bold text-emerald-600">{results.pipeline.security.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Failed</span>
                  <span className="font-bold text-red-600">{results.pipeline.security.failed}</span>
                </div>
                <button
                  onClick={() => runTests('security')}
                  disabled={loading}
                  className="w-full mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
                >
                  Run Security Tests
                </button>
              </div>
            )}
          </div>

          {/* Performance Tests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Tests</h2>
              </div>
              {results.pipeline.performance && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.performance.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(results.pipeline.performance.status)}`}>
                    {results.pipeline.performance.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.performance && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Performance Score</span>
                  <span className={`font-bold ${getScoreColor(results.pipeline.performance.performanceScore)}`}>
                    {results.pipeline.performance.performanceScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Avg Response Time</span>
                  <span className="font-bold text-slate-900 dark:text-white">{results.pipeline.performance.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Passed</span>
                  <span className="font-bold text-emerald-600">{results.pipeline.performance.passed}</span>
                </div>
              </div>
            )}
          </div>

          {/* Integration Tests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Integration Tests</h2>
              </div>
              {results.pipeline.integration && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.integration.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(results.pipeline.integration.status)}`}>
                    {results.pipeline.integration.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.integration && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Passed</span>
                  <span className="font-bold text-emerald-600">{results.pipeline.integration.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Failed</span>
                  <span className="font-bold text-red-600">{results.pipeline.integration.failed}</span>
                </div>
                {results.pipeline.integration.tests && (
                  <div className="mt-3 space-y-2">
                    {results.pipeline.integration.tests.map((test: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        {getStatusIcon(test.status)}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{test.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mt-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                Overall Pipeline Status
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Pipeline health: {results.summary.passedTests}/{results.summary.totalTests} tests passed
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Success Rate</p>
                <p className={`text-2xl font-bold ${getScoreColor(Math.round((results.summary.passedTests / results.summary.totalTests) * 100))}`}>
                  {Math.round((results.summary.passedTests / results.summary.totalTests) * 100)}%
                </p>
              </div>
              {getStatusIcon(results.summary.overallStatus)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
