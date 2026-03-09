'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminAuthCheck from '@/components/AdminAuthCheck'
import GitHubSecurityDashboard from '@/components/GitHubSecurityDashboard'
import {
    Shield, Lock, FileText, CheckSquare,
    Activity, Play, Search, Terminal, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'

export default function SecurityTestingPage() {
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<{ success: boolean; output: string; errors?: string; timestamp: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const terminalRef = useRef<HTMLDivElement>(null)

    const handleScan = async () => {
        setIsScanning(true)
        setError(null)
        setScanResult(null)

        try {
            const response = await fetch('/api/admin/security/run-scan', {
                method: 'POST'
            })
            const data = await response.json()

            if (response.ok) {
                setScanResult(data)
            } else {
                setError(data.error || 'Failed to execute scan')
                setScanResult(data) // Still set result to show log if available
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setIsScanning(false)
        }
    }

    // Auto-scroll terminal to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [scanResult])

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <AdminAuthCheck />

            <div className="max-w-6xl mx-auto p-6 lg:p-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Security Operations
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Monitor repository health, security advisories, and automated test coverage from a central command center.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Main Dashboard Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <GitHubSecurityDashboard />

                        {/* Interactive Scan Control & Terminal */}
                        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Deep Security Audit</h2>
                                    <p className="text-sm text-slate-500">Run the full SAST/DAST/Fuzzing suite server-side</p>
                                </div>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${isScanning
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        }`}
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Trigger Suite
                                        </>
                                    )}
                                </button>
                            </div>

                            <AnimatePresence>
                                {(isScanning || scanResult || error) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-black/50 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            {/* Status Banner */}
                                            {isScanning && (
                                                <div className="flex items-center gap-3 text-blue-400 text-sm mb-4 animate-pulse">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Initializing enterprise-level security protocols...</span>
                                                </div>
                                            )}

                                            {scanResult && !isScanning && (
                                                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 text-sm ${scanResult.success
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {scanResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                    <span>
                                                        {scanResult.success
                                                            ? 'Deep scan completed with 0 critical vulnerabilities found.'
                                                            : 'Deep scan completed with identified security findings.'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Terminal View */}
                                            <div
                                                ref={terminalRef}
                                                className="bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs p-5 max-h-[400px] overflow-y-auto custom-scrollbar"
                                            >
                                                <div className="flex items-center gap-2 mb-4 text-slate-600 border-b border-slate-900 pb-2">
                                                    <Terminal className="w-3 h-3" />
                                                    <span>Security Terminal</span>
                                                </div>

                                                {isScanning && !scanResult && (
                                                    <div className="text-slate-500 italic">$ npm run security:full --verbose</div>
                                                )}

                                                <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                    {scanResult?.output || scanResult?.errors || ''}
                                                    {error && !scanResult && <span className="text-red-400">{error}</span>}
                                                </pre>

                                                {!isScanning && scanResult && (
                                                    <div className="mt-4 text-slate-500 border-t border-slate-900 pt-2 flex justify-between items-center">
                                                        <span>Process finished at {new Date(scanResult.timestamp).toLocaleTimeString()}</span>
                                                        <span className={scanResult.success ? 'text-emerald-500' : 'text-amber-500'}>
                                                            Exit Code: {scanResult.success ? '0' : '1'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isScanning && !scanResult && !error && (
                                <div className="p-12 text-center text-slate-600">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                                        <Terminal className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm">Scan results will be streamed here in real-time.</p>
                                </div>
                            )}
                        </div>

                        {/* Playwright Test Coverage Section */}
                        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Functional Security Checks</h2>
                                    <p className="text-sm text-slate-500">End-to-end assertions powered by Playwright</p>
                                </div>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Play className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: '2FA Flow Protection', status: 'Automated' },
                                    { name: 'Unauthorized Access Gate', status: 'Automated' },
                                    { name: 'Security Header Validation', status: 'Automated' },
                                    { name: 'API Authentication Limits', status: 'Automated' }
                                ].map((test) => (
                                    <div key={test.name} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                            <span className="text-sm font-medium text-slate-300">{test.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{test.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        {/* Security Infrastructure Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Lock size={80} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Infrastructure Layers
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'JWT Session Encryption', active: true },
                                    { name: 'Database Row-Level Security', active: true },
                                    { name: 'Email OTP (2FA)', active: true },
                                    { name: 'CORS Origin Protection', active: true }
                                ].map((layer) => (
                                    <div key={layer.name} className="flex items-center gap-3">
                                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm text-slate-400 font-medium">{layer.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Scope */}
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-400" />
                                Audit Scope
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                    <p className="text-xs font-bold text-emerald-400 mb-1">CodeQL Static Analysis</p>
                                    <p className="text-[10px] text-slate-500">Scanning for SQLi, XSS, and dangerous data flows.</p>
                                </div>
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                    <p className="text-xs font-bold text-red-400 mb-1">Advanced SAST</p>
                                    <p className="text-[10px] text-slate-500">Custom patterns for NoSQL injection and Prototype pollution.</p>
                                </div>
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                    <p className="text-xs font-bold text-blue-400 mb-1">DAST Fuzzing</p>
                                    <p className="text-[10px] text-slate-500">Dynamic attack simulation and malformed request stress-testing.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    )
}
