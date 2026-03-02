'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminAuthCheck from '@/components/AdminAuthCheck'
import {
    CheckCircle, XCircle, AlertTriangle, Activity, Shield, Zap, GitBranch,
    Clock, RefreshCw, AlertCircle as AlertIcon, Bug, FileText, Play, X, Terminal
} from 'lucide-react'

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

export default function SecurityTestingPage() {
    const [results, setResults] = useState<TestResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastRun, setLastRun] = useState<string>('')
    const [issues, setIssues] = useState<IssueDetail[]>([])
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command }),
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
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
            const response = await fetch(`/api/test/${testType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()

            if (testType === 'all') {
                const allResults = { ...data.results, tests: data.results?.tests || [] }
                setResults(allResults)
                analyzeIssues(allResults)
            } else {
                const mockResults: TestResults = {
                    timestamp: data.timestamp || new Date().toISOString(),
                    tests: data.results?.tests || [],
                    pipeline: {
                        smoke: testType === 'smoke' ? data.results : null,
                        security: testType === 'security' ? data.results : null,
                        performance: null,
                        integration: null,
                    },
                    summary: {
                        totalTests: data.results?.summary?.total || 0,
                        passedTests: data.results?.summary?.passed || 0,
                        failedTests: data.results?.summary?.failed || 0,
                        securityScore: data.securityScore || 0,
                        performanceScore: 0,
                        overallStatus: data.status || 'UNKNOWN',
                    },
                    duration: 0,
                }
                setResults(mockResults)
                analyzeIssues(mockResults)
            }

            setLastRun(new Date().toLocaleTimeString())
        } catch (error) {
            console.error('❌ Test error:', error)
            if (error instanceof Error) {
                alert(`Test failed: ${error.message}`)
            } else {
                alert('Test failed: Unknown error occurred')
            }
        } finally {
            setLoading(false)
            const duration = ((Date.now() - startTime) / 1000).toFixed(2)
            setResults(prev => prev ? { ...prev, duration: parseFloat(duration) } : prev)
        }
    }

    const analyzeIssues = (testResults: TestResults) => {
        const foundIssues: IssueDetail[] = []
        testResults.tests.forEach(test => {
            if (test.status === 'FAIL' || test.status === 'ERROR') {
                foundIssues.push({
                    type: test.name,
                    severity: test.severity === 'HIGH' ? 'high' : 'medium',
                    description: test.details,
                    component: 'Test Suite',
                    recommendation: `Review ${test.name} implementation and fix identified issues`,
                })
            }
        })

        if (testResults.pipeline.security) {
            const securityTests = testResults.pipeline.security.tests || []
            securityTests.forEach((test: any) => {
                if (test.status === 'FAIL') {
                    foundIssues.push({
                        type: 'Security',
                        severity: 'high',
                        description: test.details,
                        component: 'Security Module',
                        recommendation: 'Address security vulnerability immediately',
                    })
                }
            })
        }
        setIssues(foundIssues)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASS': return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'FAIL': return <XCircle className="w-5 h-5 text-red-500" />
            case 'WARN': return <AlertTriangle className="w-5 h-5 text-amber-500" />
            default: return <AlertIcon className="w-5 h-5 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PASS': return 'bg-green-500/10 text-green-400 border border-green-500/20'
            case 'FAIL': return 'bg-red-500/10 text-red-400 border border-red-500/20'
            case 'WARN': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-400 border border-red-500/20'
            case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
            case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            case 'low': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
        }
    }

    useEffect(() => {
        runTests('security')
    }, [])

    return (
        <>
            <AdminAuthCheck />
            <div className="min-h-screen p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-emerald-400" />
                            Security Testing Dashboard
                        </h1>
                        <p className="text-gray-400">Comprehensive security validation and testing suite</p>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap gap-3 mb-8"
                    >
                        <button
                            onClick={() => runTests('security')}
                            disabled={loading}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                        >
                            <Shield className="w-4 h-4" />
                            Run Security Tests
                        </button>
                        <button
                            onClick={() => runTests('all')}
                            disabled={loading}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                        >
                            <Play className="w-4 h-4" />
                            Run All Tests
                        </button>
                        <button
                            onClick={() => runSecurityCommand('full')}
                            disabled={isRunningCommand}
                            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
                        >
                            <Zap className="w-4 h-4" />
                            Full Security Suite
                        </button>
                    </motion.div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-16">
                            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Running security tests...</p>
                        </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Tests', value: results.summary.totalTests, icon: GitBranch, color: 'text-white' },
                                    { label: 'Passed', value: results.summary.passedTests, icon: CheckCircle, color: 'text-green-400' },
                                    { label: 'Failed', value: results.summary.failedTests, icon: XCircle, color: 'text-red-400' },
                                    { label: 'Duration', value: `${results.duration}s`, icon: Clock, color: 'text-white' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400 font-medium">{label}</span>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>
                                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Issues */}
                            {issues.length > 0 && (
                                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Bug className="w-5 h-5 text-red-400" />
                                        Detected Issues ({issues.length})
                                    </h2>
                                    <div className="space-y-3">
                                        {issues.map((issue, i) => (
                                            <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{issue.type}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                                        {issue.severity.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-xs opacity-80 mb-1">{issue.description}</p>
                                                <p className="text-xs opacity-60">💡 {issue.recommendation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Security Script Status */}
                            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    Security Check Script Status
                                </h2>
                                {(() => {
                                    const securityTest = results.tests.find((t: any) => t.name === 'Security Check Script')
                                    if (!securityTest) {
                                        return (
                                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className="font-medium text-sm">Security Check Script Not Tested</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">Run the security test suite to check script status</p>
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="p-4 bg-gray-700/40 rounded-lg border border-gray-600">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-gray-300">Security Script Status</span>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(securityTest.status)}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(securityTest.status)}`}>
                                                        {securityTest.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {securityTest.components && (
                                                <div className="space-y-1.5 mb-3">
                                                    {Object.entries(securityTest.components).map(([key, component]: [string, any]) => (
                                                        <div key={key} className="flex items-center justify-between p-2 bg-gray-800/60 rounded">
                                                            <span className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                {getStatusIcon(component.status)}
                                                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(component.status)}`}>
                                                                    {component.status}
                                                                </span>
                                                                {component.issues > 0 && (
                                                                    <span className="text-xs text-amber-400">({component.issues})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs font-mono text-gray-400 bg-gray-900/60 p-2 rounded">{securityTest.details}</p>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Command Output */}
                            {commandOutput && (
                                <div className="bg-gray-950 rounded-xl border border-gray-700 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                            <Terminal className="w-4 h-4" />
                                            Command Output
                                        </h3>
                                        <button onClick={() => setCommandOutput(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto">{commandOutput}</pre>
                                </div>
                            )}

                            {/* Running Status */}
                            {isRunningCommand && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                    <p className="text-blue-300 text-sm font-medium">Running: {runningCommand}</p>
                                </div>
                            )}

                            {lastRun && (
                                <p className="text-center text-xs text-gray-500">Last run: {lastRun}</p>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    )
}
