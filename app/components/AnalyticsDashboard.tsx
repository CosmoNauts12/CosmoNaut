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
    Legend,
    BarChart,
    Bar
} from 'recharts';
import { useCollections, HistoryItem } from './CollectionsProvider';

// --- Sub-Components ---

const FiltersBar = ({ periods, activePeriod, onPeriodChange, workspaces, activeWorkspaceId, onWorkspaceChange, onRefresh }: any) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 liquid-glass rounded-2xl border-card-border/50">
            <div className="flex flex-wrap items-center gap-6">
                {/* Project Selector */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Project</span>
                    <select
                        value={activeWorkspaceId}
                        onChange={(e) => onWorkspaceChange(e.target.value)}
                        className="bg-black/10 dark:bg-white/5 border border-card-border/30 rounded-xl px-4 py-2 text-[11px] font-black text-foreground focus:outline-none focus:ring-2 ring-primary/20 appearance-none cursor-pointer hover:bg-black/20 dark:hover:bg-white/10 transition-all min-w-[180px]"
                    >
                        {workspaces.map((w: any) => (
                            <option key={w.id} value={w.id} className="bg-background text-foreground uppercase">{w.name}</option>
                        ))}
                    </select>
                </div>

                <div className="h-4 w-px bg-card-border/30 hidden md:block" />

                {/* Period Selector */}
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
    const { history, workspaces, activeWorkspaceId, setActiveWorkspaceId } = useCollections();
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
            { name: '200 OK', value: statusMap['2xx'] || 0, color: '#22c55e' },
            { name: '400 BAD REQUEST', value: statusMap['4xx'] || 0, color: '#eab308' },
            { name: '500 SERVER ERROR', value: statusMap['5xx'] || 0, color: '#ef4444' },
        ];

        // HTTP Methods distribution
        const methodMap = data.reduce((acc: any, item) => {
            acc[item.method] = (acc[item.method] || 0) + 1;
            return acc;
        }, {});

        const methodData = Object.entries(methodMap).map(([name, value]) => ({
            name,
            value,
            color: name === 'GET' ? '#10b981' : name === 'POST' ? '#3b82f6' : name === 'PUT' ? '#f59e0b' : '#f43f5e'
        }));

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

            // Try to extract method from the first history item for this URL
            const firstRequest = data.find(item => item.url === e.endpoint);
            const method = firstRequest?.method || 'GET';

            return {
                endpoint: e.endpoint,
                method: method,
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
            methodData,
            trendData,
            endpointData
        };
    }, [history]);

    if (!analytics || history.length === 0) {
        return (
            <div className="flex-1 flex flex-col p-8 scrollbar-hide bg-card-bg/5 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex flex-col mb-8">
                        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-[0.1em] mb-1">Performance Dashboard</h1>
                        <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50">Real-time API Analytics • MISSION CONTROL</p>
                    </div>

                    <FiltersBar
                        periods={['Today', '7 Days', '30 Days', 'All Time']}
                        activePeriod={period}
                        onPeriodChange={setPeriod}
                        workspaces={workspaces}
                        activeWorkspaceId={activeWorkspaceId}
                        onWorkspaceChange={setActiveWorkspaceId}
                        onRefresh={() => { }}
                    />

                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-foreground/5 flex items-center justify-center mb-6 animate-pulse">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                        </div>
                        <h3 className="text-lg font-black text-foreground uppercase tracking-widest mb-2">No Mission Data Yet</h3>
                        <p className="text-xs text-muted max-w-xs uppercase tracking-tight font-bold leading-relaxed">
                            Select a project or complete some API requests in your workspace to generate performance analytics.
                        </p>
                    </div>
                </div>
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
                    workspaces={workspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    onWorkspaceChange={setActiveWorkspaceId}
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
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            labelLine={false}
                                            label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
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
                            </div>
                        </div>

                        {/* Response Time Trend */}
                        <div className="lg:col-span-1 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col min-h-[350px]">
                            <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Latency Trend</h3>
                            <div className="flex-1">
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
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900 }}
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
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLatency)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Method Distribution */}
                        <div className="lg:col-span-1 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col min-h-[350px]">
                            <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Method Frequency</h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.methodData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 900 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '10px'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {analytics.methodData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </ClientOnly>

                {/* Endpoint Table */}
                <div className="liquid-glass rounded-[2.5rem] border-card-border/50 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-card-border/30 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5">
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] mb-1">Service Performance Matrix</h3>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Comparative analysis of active mission protocols</p>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Filter by endpoint or protocol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-80 bg-black/20 border border-card-border/40 rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black text-foreground focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted/50"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full border-collapse text-left">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-black/20 dark:bg-white/5 backdrop-blur-sm border-b border-card-border/20">
                                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                        <div className="flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                            Endpoint Protocol
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Missions</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Integrity</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Avg (ms)</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">P95 (ms)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border/10">
                                {filteredEndpoints.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-primary/5 transition-all duration-300">
                                        <td className="px-8 py-6 max-w-md">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black shadow-sm ring-1 ring-inset ${item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' :
                                                    item.method === 'POST' ? 'bg-amber-500/10 text-amber-500 ring-amber-500/20' :
                                                        'bg-blue-500/10 text-blue-500 ring-blue-500/20'
                                                    }`}>
                                                    {item.method}
                                                </span>
                                                <div className="flex flex-col min-w-0">
                                                    <code className="text-[11px] font-black text-foreground/90 truncate group-hover:text-primary transition-colors">
                                                        {item.endpoint}
                                                    </code>
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.1em] mt-1 opacity-60">Source IP: External Gateway</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[14px] font-black text-foreground tracking-tight">{item.total.toLocaleString()}</span>
                                                <span className="text-[8px] font-black text-muted/60 uppercase">Executions</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-[14px] font-black tracking-tight ${parseFloat(item.success) >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {item.success}%
                                                </span>
                                                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${parseFloat(item.success) >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${item.success}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-[13px] font-black text-foreground/70 tracking-tight">{item.avgResponse}</span>
                                            <span className="text-[10px] font-bold text-muted/40 ml-1">ms</span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="text-[13px] font-black text-foreground/70 tracking-tight">{item.p95}</span>
                                            <span className="text-[10px] font-bold text-muted/40 ml-1">ms</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center flex-col items-center gap-2">
                                                <div className="relative">
                                                    <div className={`w-3 h-3 rounded-full blur-[2px] animate-pulse absolute inset-0 ${item.health === 'green' ? 'bg-emerald-400' :
                                                        item.health === 'yellow' ? 'bg-amber-400' : 'bg-rose-400'
                                                        }`} />
                                                    <div className={`w-3 h-3 rounded-full relative z-10 border border-white/20 shadow-lg ${item.health === 'green' ? 'bg-emerald-500' :
                                                        item.health === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`} />
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${item.health === 'green' ? 'text-emerald-500' :
                                                    item.health === 'yellow' ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>
                                                    {item.health === 'green' ? 'Nominal' : item.health === 'yellow' ? 'Unstable' : 'Critical'}
                                                </span>
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
