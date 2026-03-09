'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminAuthCheck from '@/components/AdminAuthCheck'
import GitHubSecurityDashboard from '@/components/GitHubSecurityDashboard'
import {
    Shield, Lock, FileText, CheckSquare,
    Activity, Play, Search, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'

export default function SecurityTestingPage() {
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; githubUrl?: string; timestamp: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleScan = async () => {
        setIsScanning(true)
        setError(null)
        setScanResult(null)

        try {
            const response = await fetch('/api/admin/security/trigger-audit', {
                method: 'POST'
            })
            const data = await response.json()

            if (response.ok) {
                setScanResult(data)
            } else {
                setError(data.error || 'Failed to trigger cloud scan')
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setIsScanning(false)
        }
    }

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
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Cloud Security Center
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Enterprise-grade security audits powered by GitHub Actions. Perform deep static analysis and dynamic attack simulations.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Main Dashboard Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <GitHubSecurityDashboard />

                        {/* Cloud Audit Control */}
                        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-900/40">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Deep Infrastructure Audit</h2>
                                    <p className="text-sm text-slate-500">Triggers SAST/DAST/Fuzzing suite on GitHub Cloud</p>
                                </div>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${isScanning
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                        }`}
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Trigger Cloud Scan
                                        </>
                                    )}
                                </button>
                            </div>

                            <AnimatePresence>
                                {(isScanning || scanResult || error) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-8 bg-slate-950/40"
                                    >
                                        {/* Result Card */}
                                        {(scanResult || error) && (
                                            <div className={`rounded-2xl border p-6 flex items-start gap-4 ${scanResult?.success
                                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                                                }`}>
                                                <div className="mt-1">
                                                    {scanResult?.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold mb-1">
                                                        {scanResult?.success ? 'Cloud Audit Initiated' : 'Audit Request Failed'}
                                                    </h3>
                                                    <p className="text-sm opacity-80 leading-relaxed mb-4">
                                                        {scanResult?.message || error || 'Check your internet connection and GitHub credentials.'}
                                                    </p>

                                                    {scanResult?.githubUrl && (
                                                        <a
                                                            href={scanResult.githubUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all group"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" />
                                                            Monitor Real-Time Logs on GitHub
                                                            <Activity className="w-3 h-3 animate-pulse text-emerald-500 group-hover:text-slate-950" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {isScanning && (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                                    <Shield className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                </div>
                                                <p className="text-blue-400 text-sm font-medium animate-pulse">Contacting GitHub Cloud...</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isScanning && !scanResult && !error && (
                                <div className="p-16 text-center text-slate-600">
                                    <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Activity className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm max-w-sm mx-auto leading-relaxed">
                                        Offload complex security audits (SAST, DAST, Fuzzing) to GitHub infrastructure to ensure 100% production uptime.
                                    </p>
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
