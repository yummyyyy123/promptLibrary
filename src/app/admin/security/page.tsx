'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AdminAuthCheck from '@/components/AdminAuthCheck'
import {
    CheckCircle, XCircle, AlertTriangle, Activity, Shield, Zap, GitBranch,
    Clock, RefreshCw, AlertCircle as AlertIcon, Bug, FileText, Play, X, Terminal,
    Lock, CheckSquare, Search, Database, Globe
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
    const router = useRouter()
    const [results, setResults] = useState<TestResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastRun, setLastRun] = useState<string>('')
    const [issues, setIssues] = useState<IssueDetail[]>([])
    const [commandOutput, setCommandOutput] = useState<string | null>(null)
    const [isRunningCommand, setIsRunningCommand] = useState(false)
    const [runningCommand, setRunningCommand] = useState<string>('')
    const [vulnerabilities, setVulnerabilities] = useState<any[]>([])
    const [isFetchingVulnerabilities, setIsFetchingVulnerabilities] = useState(false)
    const [vulnerabilityData, setVulnerabilityData] = useState<any>(null)
    const [isApplyingFix, setIsApplyingFix] = useState(false)
    const [fixOutput, setFixOutput] = useState<string | null>(null)

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

    const fetchVulnerabilityIntelligence = async () => {
        setIsFetchingVulnerabilities(true)
        try {
            const response = await fetch('/api/admin/vulnerability-intelligence')
            if (response.ok) {
                const data = await response.json()
                setVulnerabilityData(data)
                setVulnerabilities(data.vulnerablePackages || [])
            }
        } catch (error) {
            console.error('Failed to fetch vulnerability intelligence:', error)
        } finally {
            setIsFetchingVulnerabilities(false)
        }
    }

    const applySecurityFix = async (action: string, packageName?: string) => {
        setIsApplyingFix(true)
        setFixOutput(null)

        try {
            const response = await fetch('/api/admin/security-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, package: packageName }),
            })

            if (response.ok) {
                const data = await response.json()
                setFixOutput(JSON.stringify(data, null, 2))
                await fetchVulnerabilityIntelligence()
            }
        } catch (error: any) {
            setFixOutput(`Error: ${error.message}`)
        } finally {
            setIsApplyingFix(false)
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
            if (testType === 'security' || testType === 'all') {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2)
                setResults(prev => prev ? { ...prev, duration: parseFloat(duration) } : prev)
            }
        }
    }

    useEffect(() => {
        fetchVulnerabilityIntelligence()
    }, [])

    const fetchVulnerabilities = fetchVulnerabilityIntelligence

    const analyzeIssues = (testResults: TestResults) => {
        const foundIssues: IssueDetail[] = []

        // Real security test results will be added below from testResults.tests
        // The mock issues below are kept as fallback or deleted if real data is sufficient

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
        fetchVulnerabilities()
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

                    {/* Top Dashboard Grid (Features & Vulnerabilities) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                        {/* Active Security Features */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 sm:p-6"
                        >
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-emerald-400" />
                                Active Security Layers
                            </h2>
                            <div className="space-y-3">
                                {[
                                    { name: 'Row Level Security (RLS)', env: 'Supabase', status: 'Active', desc: 'Database operations are strictly scoped to authenticated users.' },
                                    { name: 'Email OTP Auth', env: 'Next.js API', status: 'Active', desc: 'Admin panel protected by cryptographically secure 2FA.' },
                                    { name: 'Route Protection', env: 'Next.js Middleware', status: 'Active', desc: 'Server-side enforcement of admin authorization.' },
                                    { name: 'CORS Whitelist', env: 'API Security', status: 'Active', desc: 'Strict origin matching for API requests.' }
                                ].map((feature) => (
                                    <div key={feature.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-900/40 rounded-lg border border-gray-700/50 gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                <span className="font-medium text-gray-200 text-sm">{feature.name}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 pl-6">{feature.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pl-6 sm:pl-0">
                                            <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">{feature.env}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Enhanced Threat Intelligence */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 sm:p-6"
                        >
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-400" />
                                Threat Intelligence & Health Score
                            </h2>

                            {/* Health Score */}
                            <div className="mb-6 p-4 bg-gray-900/40 rounded-lg border border-gray-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-400">Security Health Score</span>
                                    <span className={`text-xl font-bold ${vulnerabilityData?.securityHealthScore >= 80 ? 'text-emerald-400' : vulnerabilityData?.securityHealthScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {vulnerabilityData?.securityHealthScore || 0}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${vulnerabilityData?.securityHealthScore >= 80 ? 'bg-emerald-500' : vulnerabilityData?.securityHealthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${vulnerabilityData?.securityHealthScore || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isFetchingVulnerabilities ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                                    </div>
                                ) : vulnerabilities.length > 0 ? (
                                    vulnerabilities.map((vuln: any, idx: number) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(vuln.severity.toLowerCase())}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold">{vuln.advisory.ghsa_id || 'CVE'}</span>
                                                    <span className="text-xs text-white opacity-80 bg-black/20 px-2 py-0.5 rounded">{vuln.affectedPackage}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${getSeverityColor(vuln.severity.toLowerCase())}`}>
                                                    {vuln.severity}
                                                </span>
                                            </div>
                                            <p className="text-xs opacity-80 mb-2">{vuln.advisory.summary}</p>
                                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                                                <p className="text-[10px] text-emerald-400 font-mono truncate">{vuln.recommendedAction}</p>
                                                <button
                                                    onClick={() => router.push('/admin/debug')}
                                                    className="flex-shrink-0 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-500/30 transition-colors"
                                                >
                                                    Manage Fix
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" /> No high or critical CVEs detected.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Threat Intel Actions */}
                            <div className="mt-4">
                                <button
                                    onClick={() => router.push('/admin/debug')}
                                    className="w-full px-3 py-2 bg-gray-900/60 hover:bg-gray-900 text-gray-300 text-xs rounded border border-gray-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Terminal className="w-3 h-3 text-blue-400" />
                                    Open Security Command Hub (Debug Panel)
                                </button>
                            </div>
                        </motion.div>
                    </div>


                    {/* Test Coverage Explanation */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 mb-8">
                        <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Activity className="w-4 h-4 text-blue-400" />
                            Audit Scope & Test Coverage
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                { name: 'Rate Limiting', desc: 'Prevents brute force by throttling rapid requests.' },
                                { name: 'Secret Detection', desc: 'Scans for hardcoded keys and sensitive tokens.' },
                                { name: 'OTP Validation', desc: 'Verifies 2FA expiration and reuse protection.' },
                                { name: 'Input Sanitization', desc: 'Blocks XSS and malicious injection attempts.' },
                                { name: 'Security Headers', desc: 'Checks for CSP, HSTS, and Frame-Options.' },
                                { name: 'Dependency Audit', desc: 'Scans npm packages for known vulnerabilities.' }
                            ].map((test) => (
                                <div key={test.name} className="p-3 bg-gray-900/60 rounded-lg border border-gray-700/50">
                                    <p className="text-xs font-bold text-emerald-400 mb-1">{test.name}</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">{test.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 1-Tap Security Audit - Redirect to Debug */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl p-5 sm:p-8 mb-8 text-center"
                    >
                        <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Security Operations Hub</h2>
                        <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-6">
                            Operations like 1-tap audits, secret scanning, and dependency fixes have been moved to the central <b>Debug Panel</b> to keep the dashboard focused on real-time status monitoring.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => router.push('/admin/debug')}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 font-bold"
                            >
                                <Terminal className="w-5 h-5" />
                                Go to Command Hub
                            </button>
                        </div>
                    </motion.div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-16">
                            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Running security tests...</p>
                        </div>
                    )}

                    {/* Results */}
                    {/* Global Command/Fix Outputs */}
                    {(commandOutput || fixOutput || isRunningCommand || isApplyingFix) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden mb-8 shadow-2xl"
                        >
                            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                        {isRunningCommand ? `Running: ${runningCommand}` : isApplyingFix ? 'Executing Security Fix' : 'Operation Output'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setCommandOutput(null)
                                        setFixOutput(null)
                                    }}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 overflow-hidden">
                                {(isRunningCommand || isApplyingFix) && !commandOutput && !fixOutput ? (
                                    <div className="flex items-center gap-3 py-4 text-blue-400">
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span className="text-sm font-medium animate-pulse">Processing request on secure kernel...</span>
                                    </div>
                                ) : (
                                    <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                                        {commandOutput || fixOutput}
                                    </pre>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {results && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    { label: 'Audit Duration', value: `${results.duration}s`, icon: Clock, color: 'text-gray-300' },
                                    { label: 'Checks Passed', value: results.summary.passedTests, icon: CheckCircle, color: 'text-green-400' },
                                    { label: 'Issues Found', value: issues.length, icon: AlertTriangle, color: issues.length > 0 ? 'text-amber-400' : 'text-green-400' },
                                    { label: 'Security Score', value: `${results.summary.securityScore}%`, icon: Activity, color: 'text-blue-400' },
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
                                        {issues.map((issue: any, i: number) => (
                                            <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{issue.type}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSeverityColor(issue.severity)}`}>
                                                        {issue.severity.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded mt-2 mb-2">
                                                    <p className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                                                        <AlertIcon className="w-4 h-4" /> Specific Problem:
                                                    </p>
                                                    <p className="text-sm opacity-90">{issue.description}</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded border-l-2 border-emerald-500">
                                                    <p className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-emerald-400" /> What You Must Do:
                                                    </p>
                                                    <p className="text-sm opacity-90 font-mono text-emerald-100">{issue.recommendation}</p>
                                                </div>

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
