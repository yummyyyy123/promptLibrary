'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Activity, Shield, Zap, GitBranch, Clock, RefreshCw } from 'lucide-react'

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

export default function TestDashboard() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string>('')

  const runTests = async (testType: 'all' | 'smoke' | 'security' | 'pipeline' = 'all') => {
    setLoading(true)
    try {
      const endpoint = testType === 'all' ? '/api/test/pipeline' : `/api/test/${testType}`
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (testType === 'all') {
        setResults(data.results)
      } else {
        // Mock structure for individual tests
        setResults({
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
        })
      }
      
      setLastRun(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests('pipeline')
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'ALL_TESTS_PASSED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAIL':
      case 'CRITICAL_ISSUES':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'PARTIALLY_PASSED':
      case 'MOSTLY_PASSED':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'ALL_TESTS_PASSED':
        return 'text-green-600 bg-green-50'
      case 'FAIL':
      case 'CRITICAL_ISSUES':
        return 'text-red-600 bg-red-50'
      case 'PARTIALLY_PASSED':
      case 'MOSTLY_PASSED':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading test results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testing Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Automated testing pipeline for security and functionality
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last run</p>
                <p className="text-sm font-medium">{lastRun || 'Never'}</p>
              </div>
              <button
                onClick={() => runTests('pipeline')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Run All Tests
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.summary.totalTests}</p>
              </div>
              <GitBranch className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
                <p className="text-2xl font-bold text-green-600">{results.summary.passedTests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.summary.failedTests}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.duration}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smoke Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Smoke Tests</h2>
              </div>
              {results.pipeline.smoke && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.smoke.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(results.pipeline.smoke.status)}`}>
                    {results.pipeline.smoke.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.smoke && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passed</span>
                  <span className="font-medium text-green-600">{results.pipeline.smoke.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Failed</span>
                  <span className="font-medium text-red-600">{results.pipeline.smoke.failed}</span>
                </div>
                <button
                  onClick={() => runTests('smoke')}
                  disabled={loading}
                  className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Run Smoke Tests
                </button>
              </div>
            )}
          </div>

          {/* Security Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Tests</h2>
              </div>
              {results.pipeline.security && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.security.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(results.pipeline.security.status)}`}>
                    {results.pipeline.security.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.security && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Security Score</span>
                  <span className={`font-medium ${getScoreColor(results.pipeline.security.securityScore)}`}>
                    {results.pipeline.security.securityScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passed</span>
                  <span className="font-medium text-green-600">{results.pipeline.security.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Failed</span>
                  <span className="font-medium text-red-600">{results.pipeline.security.failed}</span>
                </div>
                <button
                  onClick={() => runTests('security')}
                  disabled={loading}
                  className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Run Security Tests
                </button>
              </div>
            )}
          </div>

          {/* Performance Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Tests</h2>
              </div>
              {results.pipeline.performance && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.performance.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(results.pipeline.performance.status)}`}>
                    {results.pipeline.performance.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.performance && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Performance Score</span>
                  <span className={`font-medium ${getScoreColor(results.pipeline.performance.performanceScore)}`}>
                    {results.pipeline.performance.performanceScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                  <span className="font-medium">{results.pipeline.performance.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passed</span>
                  <span className="font-medium text-green-600">{results.pipeline.performance.passed}</span>
                </div>
              </div>
            )}
          </div>

          {/* Integration Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integration Tests</h2>
              </div>
              {results.pipeline.integration && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.pipeline.integration.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(results.pipeline.integration.status)}`}>
                    {results.pipeline.integration.status}
                  </span>
                </div>
              )}
            </div>
            {results.pipeline.integration && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Passed</span>
                  <span className="font-medium text-green-600">{results.pipeline.integration.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Failed</span>
                  <span className="font-medium text-red-600">{results.pipeline.integration.failed}</span>
                </div>
                {results.pipeline.integration.tests && (
                  <div className="mt-3 space-y-1">
                    {results.pipeline.integration.tests.map((test: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {getStatusIcon(test.status)}
                        <span className="text-gray-600 dark:text-gray-400">{test.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Status</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Pipeline health: {results.summary.passedTests}/{results.summary.totalTests} tests passed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className={`text-lg font-bold ${getScoreColor(Math.round((results.summary.passedTests / results.summary.totalTests) * 100))}`}>
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
