"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Flow, FlowBlock } from "@/app/lib/collections";
import FlowBlockUI from "./FlowBlock";
import FlowChat from "./FlowChat";
import { useCollections } from "../CollectionsProvider";
import { FlowExecutor, FlowExecutionSummary } from "./core/FlowExecutor";
import { useAuth } from "../AuthProvider";

/**
 * FlowBuilder Component (Epic 3)
 * Full scenario design canvas with sequential execution and reordering.
 * Enhanced with premium Canva-inspired floating UI.
 */
export default function FlowBuilder({ flow }: { flow: Flow }) {
    const { updateFlow, currentRole } = useCollections();
    const { isDemo } = useAuth();

    const [localFlow, setLocalFlow] = useState<Flow>(flow);
    const [isExecuting, setIsExecuting] = useState(false);
    const [summary, setSummary] = useState<FlowExecutionSummary | null>(null);
    const [showChat, setShowChat] = useState(false);

    // Canvas State
    const [viewport, setViewport] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalFlow(flow);
    }, [flow]);

    // Story 3.1: Sequential Execution Engine (Epic 3 Implementation)
    const executor = useMemo(() => new FlowExecutor((event) => {
        switch (event.type) {
            case 'BLOCK_START':
                handleBlockStateUpdate(event.blockId, { isExecuting: true, error: undefined, status: undefined });
                break;
            case 'BLOCK_END':
                handleBlockStateUpdate(event.blockId, {
                    isExecuting: false,
                    status: event.response.status,
                    duration_ms: event.duration,
                    response_data: event.response.body,
                    response_headers: event.response.headers,
                    error: event.response.error ? event.response.error.message : undefined
                });
                break;
            case 'BLOCK_ERROR':
                handleBlockStateUpdate(event.blockId, { isExecuting: false, error: event.error });
                break;
            case 'FLOW_START':
                setIsExecuting(true);
                setSummary(null);
                break;
            case 'FLOW_END':
                setIsExecuting(false);
                setSummary(event.summary);
                break;
            case 'FLOW_STOPPED':
                setIsExecuting(false);
                break;
        }
    }), []);

    const handleBlockStateUpdate = (blockId: string, updates: Partial<FlowBlock>) => {
        setLocalFlow(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
        }));
    };

    const handleUpdateBlock = (blockId: string, updates: Partial<FlowBlock>) => {
        const newBlocks = localFlow.blocks.map(b =>
            b.id === blockId ? { ...b, ...updates } : b
        );
        const newFlow = { ...localFlow, blocks: newBlocks };
        setLocalFlow(newFlow);
        updateFlow(newFlow);
    };

    const handleAddBlock = () => {
        const newBlock: FlowBlock = {
            id: `b_${Date.now()}`,
            name: "New API Step",
            method: "GET",
            url: "",
            params: [{ key: '', value: '', enabled: true }],
            headers: [{ key: '', value: '', enabled: true }],
            body: "",
            order: localFlow.blocks.length
        };
        const newFlow = { ...localFlow, blocks: [...localFlow.blocks, newBlock] };
        setLocalFlow(newFlow);
        updateFlow(newFlow);
    };

    const handleDeleteBlock = (blockId: string) => {
        const newBlocks = localFlow.blocks
            .filter(b => b.id !== blockId)
            .map((b, i) => ({ ...b, order: i }));
        const newFlow = { ...localFlow, blocks: newBlocks };
        setLocalFlow(newFlow);
        updateFlow(newFlow);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...localFlow.blocks].sort((a, b) => a.order - b.order);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[targetIndex];
        newBlocks[targetIndex] = temp;

        const finalBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
        const newFlow = { ...localFlow, blocks: finalBlocks };
        setLocalFlow(newFlow);
        updateFlow(newFlow);
    };

    const runFlow = async () => {
        setLocalFlow(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => ({ ...b, status: undefined, error: undefined, isExecuting: false, response_data: undefined }))
        }));

        await executor.execute(localFlow, !!isDemo);
    };

    // Canvas Interaction Handlers
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left click to pan
            setIsPanning(true);
            e.preventDefault();
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setViewport(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        } else if (draggedBlockId) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = (e.clientX - rect.left - viewport.x) / zoom - dragOffset.x;
            const y = (e.clientY - rect.top - viewport.y) / zoom - dragOffset.y;

            handleUpdateBlock(draggedBlockId, { x, y });
        }
    };

    const handleCanvasMouseUp = () => {
        setIsPanning(false);
        setDraggedBlockId(null);
    };

    const handleNodeDragStart = (blockId: string, e: React.MouseEvent) => {
        const block = localFlow.blocks.find(b => b.id === blockId);
        if (!block) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDraggedBlockId(blockId);
        setDragOffset({
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        });
        e.stopPropagation();
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * zoomDelta, 0.2), 2));
            e.preventDefault();
        } else {
            setViewport(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden font-outfit transition-colors duration-500">
            {/* Full-Page Split Decorative Grid - Pans with Canvas */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 overflow-hidden bg-background">
                {/* Fixed Background container that doesn't transform so it always fills the screen */}
                <div className="absolute inset-0">
                    {/* Top-Left Triangle: Blue Dots */}
                    <div className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
                        style={{
                            backgroundImage: `radial-gradient(circle, #0ea5e9 2.5px, transparent 2.5px)`,
                            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
                            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                            clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                        }} />
                    {/* Bottom-Right Triangle: Light Green Dots */}
                    <div className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
                        style={{
                            backgroundImage: `radial-gradient(circle, #10b981 2.5px, transparent 2.5px)`,
                            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
                            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                            clipPath: 'polygon(100% 100%, 100% 0, 0 100%)'
                        }} />
                </div>
            </div>

            <style jsx>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -100;
                    }
                }
                .animate-dash {
                    animation: dash 5s linear infinite;
                }
            `}</style>

            {/* Header / Title Area */}
            <div className="px-8 py-6 flex items-center justify-between z-10 bg-background/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors duration-500">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-primary to-orange-500 p-[1px] shadow-lg shadow-primary/20">
                        <div className="w-full h-full rounded-[1.2rem] bg-white dark:bg-[#020617] flex items-center justify-center text-primary transition-colors duration-500">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-foreground uppercase tracking-[0.1em] leading-tight mb-0.5 transition-colors duration-500">{localFlow.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">Active Protocol</span>
                            <span className="text-[10px] text-foreground/20 dark:text-white/20 font-bold uppercase tracking-widest transition-colors duration-500">• {localFlow.blocks.length} Steps Defined</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 ${showChat ? 'bg-gradient-to-br from-primary to-cyan-500 border-primary/50 text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-[#0c1a2e] border-black/5 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 shadow-sm'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <div className="w-px h-8 bg-black/5 dark:bg-white/10 mx-2" />
                    <button
                        className="px-8 py-3 bg-white dark:bg-[#0c1a2e] border border-black/5 dark:border-white/10 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-[#112240] hover:shadow-lg hover:shadow-cyan-500/10 shadow-sm transition-all duration-300 uppercase tracking-[0.2em]"
                        onClick={handleAddBlock}
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Execution Summary Notification */}
            {
                summary && (
                    <div className="px-8 py-4 z-20 animate-in slide-in-from-top-4 duration-500 bg-background/50 backdrop-blur-sm border-b border-black/5 dark:border-white/5">
                        <div className={`p-4 rounded-[1.5rem] border flex items-center justify-between backdrop-blur-xl ${summary.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.success ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                    {summary.success ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest">Protocol Execution Complete</p>
                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                                        {summary.executedBlocks}/{summary.totalBlocks} Blocks Processed • {summary.totalDurationMs}ms Latency
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSummary(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Canvas Area with Absolute Positioning */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden select-none z-1"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleWheel}
            >
                <div
                    className="absolute inset-0 transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})`,
                        transformOrigin: '0 0'
                    }}
                >
                    {localFlow.blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center text-white/20 mb-8">
                                <img src="/robot.png" className="w-16 h-16 opacity-40 grayscale" alt="Robot Mascot Empty State" />
                            </div>
                            <h3 className="text-lg font-black text-white/80 uppercase tracking-[0.2em] mb-3">Initialize your Mission</h3>
                            <button
                                onClick={handleAddBlock}
                                className="px-10 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                Create First Node
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* SVG Connections Layer */}
                            <svg className="absolute inset-0 pointer-events-none w-[10000px] h-[10000px] overflow-visible">
                                <defs>
                                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-primary/60" />
                                    </marker>
                                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
                                    </linearGradient>
                                </defs>
                                {localFlow.blocks.length > 1 && [...localFlow.blocks].sort((a, b) => a.order - b.order).map((block, i, arr) => {
                                    if (i === arr.length - 1) return null;
                                    const nextBlock = arr[i + 1];

                                    const startX = (block.x ?? 100) + 450;
                                    const startY = (block.y ?? (100 + i * 500)) + 60;
                                    const endX = nextBlock.x ?? 100;
                                    const endY = (nextBlock.y ?? (100 + (i + 1) * 500)) + 30;

                                    const cp1x = startX + (endX - startX) / 2;
                                    const cp2x = startX + (endX - startX) / 2;

                                    return (
                                        <path
                                            key={`path-${block.id}`}
                                            d={`M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`}
                                            stroke="url(#line-gradient)"
                                            strokeWidth="6"
                                            fill="none"
                                            strokeDasharray="12 8"
                                            className="animate-dash"
                                            style={{ filter: 'drop-shadow(0 0 10px rgba(14, 165, 233, 0.4))' }}
                                        />
                                    );
                                })}
                            </svg>

                            {localFlow.blocks.map((block) => (
                                <div
                                    key={block.id}
                                    className="absolute transition-shadow duration-300"
                                    style={{
                                        left: block.x ?? 100,
                                        top: block.y ?? (100 + block.order * 500),
                                        zIndex: draggedBlockId === block.id ? 100 : 10,
                                        filter: draggedBlockId === block.id ? 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' : 'none'
                                    }}
                                >
                                    <FlowBlockUI
                                        block={block}
                                        onUpdateAction={(updates: Partial<FlowBlock>) => handleUpdateBlock(block.id, updates)}
                                        onDeleteAction={(blockId: string) => handleDeleteBlock(blockId)}
                                        onRunAction={(b: FlowBlock) => executor.execute({ ...localFlow, blocks: [b] }, !!isDemo)}
                                        onDragStartAction={(e) => handleNodeDragStart(block.id, e)}
                                        isExecuting={isExecuting}
                                        readOnly={currentRole === 'read'}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mini-map and Controls Overlay */}
                <div className="absolute bottom-10 left-10 z-30 flex flex-col gap-4">
                    <div className="bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-xl border border-black/5 dark:border-cyan-500/10 rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/30 transition-colors duration-500">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 hover:bg-cyan-500/10 rounded-lg text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-cyan-500/10 rounded-lg text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <div className="w-px h-6 bg-black/5 dark:bg-cyan-500/15 mx-1" />
                            <button onClick={() => { setViewport({ x: 0, y: 0 }); setZoom(1); }} className="p-2 hover:bg-cyan-500/10 rounded-lg text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Reset View">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Canva-style Control Bar */}
            {
                localFlow.blocks.length > 0 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-2xl border border-black/5 dark:border-cyan-500/10 p-2 rounded-[2rem] shadow-2xl shadow-black/10 dark:shadow-black/30 flex items-center gap-2 transition-colors duration-500">
                            <button
                                onClick={runFlow}
                                disabled={isExecuting}
                                className={`h-12 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 ${isExecuting ? 'bg-slate-200 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-[#0066CC] via-[#0088EE] to-[#00AAFF] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95'}`}
                            >
                                {isExecuting ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                )}
                                {isExecuting ? 'Executing...' : 'Run Protocol'}
                            </button>

                            <div className="w-px h-8 bg-black/5 dark:bg-cyan-500/15 mx-1" />

                            <button
                                onClick={handleAddBlock}
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#0c1a2e] hover:bg-slate-50 dark:hover:bg-[#112240] border border-black/5 dark:border-white/10 hover:border-cyan-500/30 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 active:scale-90 shadow-sm dark:shadow-none"
                                title="Add Node"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>

                            <button
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[#0c1a2e] hover:bg-slate-50 dark:hover:bg-[#112240] border border-black/5 dark:border-white/10 hover:border-cyan-500/30 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300 active:scale-90 shadow-sm dark:shadow-none"
                                title="Grid View"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* AI Chat Drawer */}
            {
                showChat && (
                    <div className="absolute top-0 right-0 bottom-0 w-96 bg-white dark:bg-[#0F172A] border-l border-black/5 dark:border-white/10 z-40 animate-in slide-in-from-right duration-500 shadow-2xl shadow-black/20 dark:shadow-black/50">
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-foreground/80 dark:text-white/80 transition-colors duration-500">Flow Oracle</span>
                                </div>
                                <button onClick={() => setShowChat(false)} className="text-muted/20 dark:text-white/20 hover:text-foreground dark:hover:text-white transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <FlowChat flow={localFlow} />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
