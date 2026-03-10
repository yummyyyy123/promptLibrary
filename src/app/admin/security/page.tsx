'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
    Shield,
    AlertTriangle,
    Info,
    Lock,
    RefreshCw,
    Filter,
    Clock,
    User,
    Globe
} from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface SecurityLog {
    id: string
    event_type: string
    severity: 'info' | 'warning' | 'critical'
    ip_address: string
    user_agent: string
    details: any
    created_at: string
}

export default function SecurityDashboard() {
    const [logs, setLogs] = useState<SecurityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    const fetchLogs = async () => {
        setLoading(true)
        let query = supabase
            .from('security_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (filter !== 'all') {
            if (filter === 'critical') {
                query = query.eq('severity', 'critical')
            } else if (filter === 'warnings') {
                query = query.eq('severity', 'warning')
            }
        }

        const { data, error } = await query
        if (data) setLogs(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()

        // Subscribe to new logs
        const channel = supabase
            .channel('security_logs_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_logs' }, (payload) => {
                setLogs(prev => [payload.new as SecurityLog, ...prev.slice(0, 49)])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
            case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        }
    }

    const getEventIcon = (type: string) => {
        if (type.includes('failure') || type.includes('bypass') || type.includes('unauthorized')) {
            return <AlertTriangle className="w-4 h-4" />
        }
        if (type.includes('rate_limit')) {
            return <Lock className="w-4 h-4" />
        }
        return <Info className="w-4 h-4" />
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-600/30">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                Security Monitoring
                            </h1>
                            <p className="text-white/40 text-sm mt-1">Real-time threat detection and audit logs</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                            {['all', 'warnings', 'critical'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setFilter(item)}
                                    className={`px-4 py-1.5 rounded-md text-sm transition-all ${filter === item ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    {item.charAt(0).toUpperCase() + item.slice(1)}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <p className="text-white/40 text-sm mb-2">Total Events (30d)</p>
                        <h3 className="text-4xl font-bold">{logs.length}+</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                        <p className="text-white/40 text-sm mb-2">Active Threats</p>
                        <h3 className="text-4xl font-bold text-amber-500">
                            {logs.filter(l => l.severity === 'warning').length}
                        </h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl border-red-500/20">
                        <p className="text-white/40 text-sm mb-2">Critical Alerts</p>
                        <h3 className="text-4xl font-bold text-red-500">
                            {logs.filter(l => l.severity === 'critical').length}
                        </h3>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-sm font-medium text-white/40">Event</th>
                                    <th className="px-6 py-4 text-sm font-medium text-white/40">Severity</th>
                                    <th className="px-6 py-4 text-sm font-medium text-white/40">Origin</th>
                                    <th className="px-6 py-4 text-sm font-medium text-white/40">Timestamp</th>
                                    <th className="px-6 py-4 text-sm font-medium text-white/40 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                                            No security events recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${getSeverityColor(log.severity)}`}>
                                                        {getEventIcon(log.event_type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white/90 capitalize">
                                                            {log.event_type.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-xs text-white/30 truncate max-w-[200px]">
                                                            {log.user_agent}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${getSeverityColor(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-sm text-white/70">
                                                        <Globe className="w-3 h-3" />
                                                        {log.ip_address || 'unknown'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                                                        <User className="w-3 h-3" />
                                                        {log.details?.username || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-white/40">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 font-medium underline underline-offset-4">
                                                    View Payload
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        tr { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
        </div>
    )
}
