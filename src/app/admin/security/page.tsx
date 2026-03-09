'use client'

import { motion } from 'framer-motion'
import AdminAuthCheck from '@/components/AdminAuthCheck'
import GitHubSecurityDashboard from '@/components/GitHubSecurityDashboard'
import {
    Shield, Lock, FileText, CheckSquare,
    Activity, Play, Search, Terminal
} from 'lucide-react'

export default function SecurityTestingPage() {
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
                                    <p className="text-xs font-bold text-red-400 mb-1">Secret Scanning</p>
                                    <p className="text-[10px] text-slate-500">Ensuring no API keys or database tokens are exposed.</p>
                                </div>
                                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                    <p className="text-xs font-bold text-blue-400 mb-1">Dependabot Audit</p>
                                    <p className="text-[10px] text-slate-500">Monitoring supply chain for known vulnerabilities (CVEs).</p>
                                </div>
                            </div>
                        </div>

                        {/* Manual Actions */}
                        <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center">
                            <Terminal className="w-8 h-8 text-emerald-500/40 mx-auto mb-3" />
                            <h4 className="text-sm font-bold text-white mb-2">Technical Audit</h4>
                            <p className="text-[10px] text-slate-500 mb-4">Run full security suite from terminal for localized analysis</p>
                            <code className="text-[10px] bg-black/40 px-2 py-1 rounded text-emerald-400 font-mono">
                                npm run security:full
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
