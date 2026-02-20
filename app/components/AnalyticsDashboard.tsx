"use client";

import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
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

// --- Mock Data ---

const STATUS_CODE_DATA = [
    { name: '200 OK', value: 850, color: '#10b981' },
    { name: '400 Bad Request', value: 120, color: '#f59e0b' },
    { name: '500 Server Error', value: 30, color: '#f43f5e' },
];

const PERFORMANCE_TREND_DATA = [
    { time: '00:00', latency: 120, requests: 45 },
    { time: '04:00', latency: 132, requests: 52 },
    { time: '08:00', latency: 101, requests: 89 },
    { time: '12:00', latency: 134, requests: 124 },
    { time: '16:00', latency: 155, requests: 145 },
    { time: '20:00', latency: 130, requests: 98 },
    { time: '23:59', latency: 110, requests: 67 },
];

const ENDPOINT_DATA = [
    { id: 1, endpoint: '/api/v1/users', total: 1250, success: 98.5, avgResponse: 115, p95: 210, health: 'green' },
    { id: 2, endpoint: '/api/v1/auth/login', total: 850, success: 94.2, avgResponse: 230, p95: 450, health: 'yellow' },
    { id: 3, endpoint: '/api/v1/products', total: 3200, success: 99.8, avgResponse: 85, p95: 140, health: 'green' },
    { id: 4, endpoint: '/api/v1/orders/create', total: 450, success: 88.5, avgResponse: 540, p95: 1200, health: 'red' },
    { id: 5, endpoint: '/api/v1/billing/invoice', total: 120, success: 96.0, avgResponse: 320, p95: 680, health: 'yellow' },
];

const KPI_DATA = [
    { label: 'Total Requests', value: '5,892', change: '+12%', type: 'neutral' },
    { label: 'Success Rate', value: '96.4%', change: '+0.5%', type: 'positive' },
    { label: 'Failure Rate', value: '3.6%', change: '-0.2%', type: 'negative' },
    { label: 'Avg Latency', value: '142ms', change: '-15ms', type: 'positive' },
    { label: 'Health Score', value: '92/100', change: 'Stable', type: 'neutral' },
];

// --- Sub-Components ---

const FiltersBar = () => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 liquid-glass rounded-2xl border-card-border/50">
            <div className="flex items-center gap-4">
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {['Today', '7 Days', '30 Days', 'Custom'].map((period) => (
                        <button
                            key={period}
                            className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${period === '7 Days' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted hover:text-foreground'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                <select className="glass-select rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 border-none outline-none focus:ring-2 ring-primary/20 cursor-pointer">
                    <option>All Projects</option>
                    <option>Cosmo Main API</option>
                    <option>Auth Service</option>
                </select>

                <select className="glass-select rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 border-none outline-none focus:ring-2 ring-primary/20 cursor-pointer">
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Dev</option>
                </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all group">
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

export default function AnalyticsDashboard() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEndpoints = useMemo(() => {
        return ENDPOINT_DATA.filter(e => e.endpoint.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    return (
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-card-bg/5 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-[0.1em] mb-1">Performance Dashboard</h1>
                    <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50">Real-time API Analytics & Mission Control</p>
                </div>

                <FiltersBar />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    {KPI_DATA.map((kpi, idx) => (
                        <KPICard key={idx} {...kpi} />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Status Distribution */}
                    <div className="lg:col-span-1 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col">
                        <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Status Codes</h3>
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={STATUS_CODE_DATA}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {STATUS_CODE_DATA.map((entry, index) => (
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
                                <span className="text-2xl font-black text-foreground">96%</span>
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Uptime</span>
                            </div>
                        </div>
                    </div>

                    {/* Response Time Trend */}
                    <div className="lg:col-span-2 liquid-glass p-6 rounded-[2.5rem] border-card-border/50 flex flex-col">
                        <h3 className="text-xs font-black mb-6 text-foreground uppercase tracking-widest">Global Performance Trend</h3>
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={PERFORMANCE_TREND_DATA}>
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
                                    <Area
                                        type="monotone"
                                        dataKey="requests"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                                {filteredEndpoints.map((item) => (
                                    <tr key={item.id} className="hover:bg-foreground/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <code className="text-[11px] font-black text-primary px-2 py-1 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                {item.endpoint}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[12px] font-black text-foreground/80">{item.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[12px] font-black ${item.success >= 98 ? 'text-emerald-500' : 'text-amber-500'}`}>
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
