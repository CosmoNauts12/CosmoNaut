"use client";

import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useCollections, HistoryItem } from './CollectionsProvider';

// --- Sub-Components ---

const FiltersBar = ({ periods, activePeriod, onPeriodChange, onRefresh }: any) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 liquid-glass rounded-2xl border-card-border/50">
            <div className="flex items-center gap-4">
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {periods.map((period: string) => (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activePeriod === period ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted hover:text-foreground'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all group"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 16h5v5"></path>
                </svg>
                <span className="text-[11px] font-black uppercase tracking-widest">Refresh</span>
            </button>
        </div>
    );
};

const KPICard = ({ label, value, change, type }: any) => {
    return (
        <div className="liquid-glass p-6 rounded-[2rem] border-card-border/50 flex flex-col items-center text-center group hover:border-primary/40 transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">{label}</span>
            <span className="text-2xl font-black text-foreground mb-1 tracking-tight">{value}</span>
            <span className={`text-[10px] font-black ${type === 'positive' ? 'text-emerald-500' :
                type === 'negative' ? 'text-rose-500' : 'text-primary/70'
                }`}>
                {change}
            </span>
        </div>
    );
};

// Client-only wrapper to prevent hydration mismatches and hangs
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <>{children}</>;
};

export default function AnalyticsDashboard() {
    const { history } = useCollections();
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState('All Time');

    // Aggregate Real Data
    const analytics = useMemo(() => {
        if (!history || history.length === 0) return null;

        // Filter by period if needed (simplified All Time logic for now)
        const data = history;

        const totalRequests = data.length;
        const successRequests = data.filter(item => item.status >= 200 && item.status < 300).length;
        const failRequests = totalRequests - successRequests;
        const successRate = totalRequests > 0 ? (successRequests / totalRequests * 100).toFixed(1) : "0";
        const failureRate = totalRequests > 0 ? (failRequests / totalRequests * 100).toFixed(1) : "0";

        const avgLatency = totalRequests > 0
            ? Math.round(data.reduce((acc, item) => acc + item.duration_ms, 0) / totalRequests)
            : 0;

        // Status codes distribution
        const statusMap = data.reduce((acc: any, item) => {
            const code = item.status;
            const category = code >= 500 ? '5xx' : code >= 400 ? '4xx' : '2xx';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        const statusCodeData = [
            { name: '2xx Success', value: statusMap['2xx'] || 0, color: '#10b981' },
            { name: '4xx Client Err', value: statusMap['4xx'] || 0, color: '#f59e0b' },
            { name: '5xx Server Err', value: statusMap['5xx'] || 0, color: '#f43f5e' },
        ];

        // Performance trend (grouped by hour or similar)
        // Here we'll just take the last 20 items to show a trend line
        const trendData = data.slice(-20).map((item, idx) => ({
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            latency: item.duration_ms,
            requests: 1
        }));

        // Endpoint table data
        const endpointMap = data.reduce((acc: any, item) => {
            const url = item.url;
            if (!acc[url]) {
                acc[url] = { endpoint: url, total: 0, success: 0, totalLatency: 0, latencies: [] };
            }
            acc[url].total += 1;
            if (item.status < 400) acc[url].success += 1;
            acc[url].totalLatency += item.duration_ms;
            acc[url].latencies.push(item.duration_ms);
            return acc;
        }, {});

        const endpointData = Object.values(endpointMap).map((e: any) => {
            const sortedLatencies = [...e.latencies].sort((a, b) => a - b);
            const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || sortedLatencies[0];
            const successPct = ((e.success / e.total) * 100).toFixed(1);
            return {
                endpoint: e.endpoint,
                total: e.total,
                success: successPct,
                avgResponse: Math.round(e.totalLatency / e.total),
                p95: p95,
                health: parseFloat(successPct) > 95 ? 'green' : parseFloat(successPct) > 80 ? 'yellow' : 'red'
            };
        });

        return {
            totalRequests,
            successRate,
            failureRate,
            avgLatency,
            statusCodeData,
            trendData,
            endpointData
        };
    }, [history]);

    if (!analytics || history.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-foreground/5 flex items-center justify-center mb-6 animate-pulse">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                </div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-widest mb-2">No Mission Data Yet</h3>
                <p className="text-xs text-muted max-w-xs uppercase tracking-tight font-bold leading-relaxed">
                    Complete some API requests in your workspace to generate performance analytics.
                </p>
            </div>
        );
    }

    const filteredEndpoints = analytics.endpointData.filter(e => e.endpoint.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-card-bg/5 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-[0.1em] mb-1">Performance Dashboard</h1>
                    <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50">Real-time API Analytics • MISSION CONTROL</p>
                </div>

                <FiltersBar
                    periods={['Today', '7 Days', '30 Days', 'All Time']}
                    activePeriod={period}
                    onPeriodChange={setPeriod}
                    onRefresh={() => { }}
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <KPICard label="Total Requests" value={analytics.totalRequests} change="+Live" type="neutral" />
                    <KPICard label="Success Rate" value={`${analytics.successRate}%`} change="Stable" type="positive" />
                    <KPICard label="Avg Latency" value={`${analytics.avgLatency}ms`} change="Real-time" type="neutral" />
                    <KPICard label="Health Score" value={`${analytics.successRate}/100`} change="Computed" type="positive" />
                </div>

                <ClientOnly>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Status Distribution */}
                        <div className="lg:col-span-1 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col">
                            <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Status Codes</h3>
                            <div className="flex-1 min-h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.statusCodeData}
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {analytics.statusCodeData.map((entry, index) => (entry.value > 0 &&
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            formatter={(value) => <span className="text-[10px] font-black text-muted uppercase tracking-wider">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                                    <span className="text-2xl font-black text-foreground">{analytics.successRate}%</span>
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Success</span>
                                </div>
                            </div>
                        </div>

                        {/* Response Time Trend */}
                        <div className="lg:col-span-2 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col">
                            <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Recent Performance Trend</h3>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.trendData}>
                                        <defs>
                                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '11px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="latency"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorLatency)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </ClientOnly>

                {/* Endpoint Table */}
                <div className="liquid-glass rounded-[2.5rem] border-card-border/50 overflow-hidden">
                    <div className="p-6 border-b border-card-border/30 flex items-center justify-between">
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Endpoint Performance Metrics</h3>
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="Filter endpoints..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/5 border border-card-border/30 rounded-xl px-4 py-2 text-[11px] font-bold text-foreground focus:outline-none focus:ring-2 ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-black/10 dark:bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Endpoint</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Requests</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Success %</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Avg (ms)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">P95 (ms)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border/20">
                                {filteredEndpoints.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-foreground/5 transition-colors group">
                                        <td className="px-6 py-4 max-w-xs">
                                            <code className="text-[10px] font-black text-primary px-2 py-1 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors truncate block">
                                                {item.endpoint}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[12px] font-black text-foreground/80">{item.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[12px] font-black ${parseFloat(item.success) >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {item.success}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[12px] font-black text-foreground/70">{item.avgResponse}ms</td>
                                        <td className="px-6 py-4 text-right text-[12px] font-black text-foreground/70">{item.p95}ms</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${item.health === 'green' ? 'bg-emerald-500 shadow-emerald-500/30' :
                                                    item.health === 'yellow' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-rose-500 shadow-rose-500/30'
                                                    }`} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
