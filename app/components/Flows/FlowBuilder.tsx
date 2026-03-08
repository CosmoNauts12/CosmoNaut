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
    const { updateFlow, currentRole, collections } = useCollections();
    const { isDemo } = useAuth();

    const [localFlow, setLocalFlow] = useState<Flow>(flow);
    const [isExecuting, setIsExecuting] = useState(false);
    const [summary, setSummary] = useState<FlowExecutionSummary | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isElementsOpen, setIsElementsOpen] = useState(true);
    const [showEmptyImportMenu, setShowEmptyImportMenu] = useState(false);
    const importEmptyMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (importEmptyMenuRef.current && !importEmptyMenuRef.current.contains(event.target as Node)) {
                setShowEmptyImportMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Firebase (and Firestore specifically) rejects `undefined` values. 
    // Since execution state often sets properties to undefined to clear them (e.g. error: undefined),
    // we must sanitize blocks before sending them up via `updateFlow`.
    const cleanFlowBeforeSave = (flowToClean: Flow): Flow => {
        return {
            ...flowToClean,
            blocks: flowToClean.blocks.map(block => {
                const cleanedBlock: any = { ...block };
                Object.keys(cleanedBlock).forEach(key => {
                    if (cleanedBlock[key] === undefined) {
                        delete cleanedBlock[key];
                    }
                });
                return cleanedBlock as FlowBlock;
            })
        };
    };

    const handleUpdateBlock = (blockId: string, updates: Partial<FlowBlock>) => {
        const newBlocks = localFlow.blocks.map(b =>
            b.id === blockId ? { ...b, ...updates } : b
        );
        const newFlow = { ...localFlow, blocks: newBlocks };
        setLocalFlow(newFlow);
        updateFlow(cleanFlowBeforeSave(newFlow));
    };

    const handleAddBlock = () => {
        handleAddNode('Start');
    };

    const handleImportFirstNode = (req: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        let addX = 100;
        let addY = 100;

        if (rect) {
            addX = (rect.width / 2 - viewport.x) / zoom;
            addY = (rect.height / 2 - viewport.y) / zoom;
        }

        const snappedX = Math.round(addX / 20) * 20;
        const snappedY = Math.round(addY / 20) * 20;

        const newBlock: FlowBlock = {
            id: `b_${Date.now()}`,
            name: req.name, // Use request name
            method: req.method,
            url: req.url,
            params: req.params && req.params.length > 0 ? req.params : [{ key: '', value: '', enabled: true }],
            headers: req.headers && req.headers.length > 0 ? req.headers : [{ key: '', value: '', enabled: true }],
            body: req.body || '',
            order: 0,
            x: snappedX,
            y: snappedY
        };

        const newFlow = { ...localFlow, blocks: [newBlock] };
        setLocalFlow(newFlow);
        updateFlow(cleanFlowBeforeSave(newFlow));
        setShowEmptyImportMenu(false);
    };

    const handleSaveFlow = () => {
        setIsSaving(true);
        updateFlow(cleanFlowBeforeSave(localFlow));
        setTimeout(() => setIsSaving(false), 2000);
    };

    const handleDeleteBlock = (blockId: string) => {
        const newBlocks = localFlow.blocks
            .filter(b => b.id !== blockId)
            .map((b, i) => ({ ...b, order: i }));
        const newFlow = { ...localFlow, blocks: newBlocks };
        setLocalFlow(newFlow);
        updateFlow(cleanFlowBeforeSave(newFlow));
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
        updateFlow(cleanFlowBeforeSave(newFlow));
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

            // Grid Snapping mechanism (Snap to 20px grid)
            const snappedX = Math.round(x / 20) * 20;
            const snappedY = Math.round(y / 20) * 20;

            handleUpdateBlock(draggedBlockId, { x: snappedX, y: snappedY });
        }
    };

    const handleCanvasMouseUp = () => {
        setIsPanning(false);
        setDraggedBlockId(null);
    };

    const handleAddNode = (nodeType: string) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        let addX = 100;
        let addY = 100;

        if (rect) {
            // Find center of the visible canvas
            addX = (rect.width / 2 - viewport.x) / zoom;
            addY = (rect.height / 2 - viewport.y) / zoom;
        }

        // Offset slightly based on number of blocks to avoid exact pile-up
        const offset = localFlow.blocks.length * 20;
        const x = addX + offset;
        const y = addY + offset;

        // Grid Snapping mechanism (Snap to 20px grid)
        const snappedX = Math.round(x / 20) * 20;
        const snappedY = Math.round(y / 20) * 20;

        const newBlock: FlowBlock = {
            id: `b_${Date.now()}`,
            name: nodeType,
            method: nodeType === 'Request' ? "GET" : "POST",
            url: "",
            params: [{ key: '', value: '', enabled: true }],
            headers: [{ key: '', value: '', enabled: true }],
            body: "",
            order: localFlow.blocks.length,
            x: snappedX,
            y: snappedY
        };

        const newFlow = { ...localFlow, blocks: [...localFlow.blocks, newBlock] };
        setLocalFlow(newFlow);
        updateFlow(cleanFlowBeforeSave(newFlow));
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
            {/* Elegant Background Grid - Canvas Aesthetic */}
            <div className="absolute inset-0 z-0 opacity-[0.25] dark:opacity-[0.2] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle, var(--primary) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

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
                        className={`px-8 py-3 bg-foreground/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-[10px] font-black transition-all duration-200 uppercase tracking-[0.2em] shadow-sm hover:shadow-md active:scale-95 ${isSaving ? 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10' : 'text-muted hover:text-foreground dark:hover:text-white hover:border-foreground/20 dark:hover:border-white/30 hover:bg-foreground/10 dark:hover:bg-white/10'}`}
                        onClick={handleSaveFlow}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saved!' : 'Save Configuration'}
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
                        <button onClick={() => setSummary(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-90 opacity-60 hover:opacity-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
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
                                <img src="/astro.png" className="w-16 h-16 opacity-40 grayscale" alt="Empty" />
                            </div>
                            <h3 className="text-lg font-black text-white/80 uppercase tracking-[0.2em] mb-3">Initialize your Mission</h3>
                            <div className="flex flex-col items-center gap-3 relative" ref={importEmptyMenuRef}>
                                <button
                                    onClick={handleAddBlock}
                                    className="px-10 py-4 w-56 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                                >
                                    Create First Node
                                </button>

                                <button
                                    onClick={() => setShowEmptyImportMenu(!showEmptyImportMenu)}
                                    className="px-10 py-4 w-56 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/50 hover:text-white/80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Import Request
                                </button>

                                {showEmptyImportMenu && (
                                    <div className="absolute top-[calc(100%+8px)] w-64 max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-[#252525] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        {collections.flatMap((c: any) => c.requests).length === 0 ? (
                                            <div className="px-4 py-3 text-center text-xs text-muted/60">No saved requests found</div>
                                        ) : (
                                            collections.flatMap((c: any) => c.requests).map((req: any) => (
                                                <button
                                                    key={req.id}
                                                    onClick={() => handleImportFirstNode(req)}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group/import"
                                                >
                                                    <span className={`text-[9px] font-black uppercase w-10 text-right ${req.method === 'GET' ? 'text-emerald-500' :
                                                        req.method === 'POST' ? 'text-amber-500' :
                                                            req.method === 'PUT' ? 'text-blue-500' :
                                                                'text-rose-500'
                                                        }`}>{req.method}</span>
                                                    <span className="text-xs font-semibold text-foreground/80 dark:text-white/80 truncate group-hover/import:text-primary transition-colors">{req.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
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

                                    // Dynamic Connection path logic for smooth curve
                                    const cp1x = startX + Math.max(100, (endX - startX) / 2);
                                    const cp2x = endX - Math.max(100, (endX - startX) / 2);

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
                                    className="absolute transition-shadow duration-300 animate-in zoom-in-95 fade-in ease-out"
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
                    <div className="bg-white/90 dark:bg-[#0F172A]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-foreground/50 hover:text-foreground dark:text-white/50 dark:hover:text-white transition-all duration-200 active:scale-90">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <span className="text-[10px] font-black text-foreground/70 dark:text-white/70 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-foreground/50 hover:text-foreground dark:text-white/50 dark:hover:text-white transition-all duration-200 active:scale-90">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
                            <button onClick={() => { setViewport({ x: 0, y: 0 }); setZoom(1); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-foreground/50 hover:text-foreground dark:text-white/50 dark:hover:text-white transition-all duration-200 active:scale-90" title="Reset View">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Canva-style Control Bar */}
            {localFlow.blocks.length > 0 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 p-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center gap-2">
                        <button
                            onClick={runFlow}
                            disabled={isExecuting}
                            className={`h-14 px-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-200 ${isExecuting ? 'bg-black/5 dark:bg-white/5 text-foreground/40 dark:text-white/40 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:scale-95'}`}
                        >
                            {isExecuting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                            {isExecuting ? 'Executing...' : 'Run Protocol'}
                        </button>

                        <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1" />

                        <button
                            onClick={() => setIsElementsOpen(!isElementsOpen)}
                            className={`w-14 h-14 flex items-center justify-center border border-transparent hover:border-black/10 dark:hover:border-white/20 rounded-2xl transition-all duration-200 active:scale-90 ${isElementsOpen ? 'bg-black/10 dark:bg-white/10 text-primary' : 'bg-black/5 dark:bg-white/5 text-foreground/60 hover:text-foreground dark:text-white/60 dark:hover:text-white'}`}
                            title="Elements"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>

                        <button
                            className="w-14 h-14 flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-black/10 dark:hover:border-white/20 rounded-2xl text-foreground/60 hover:text-foreground dark:text-white/60 dark:hover:text-white transition-all duration-200 active:scale-90"
                            title="Grid View"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Canva-style Elements Sidebar */}
            <div className={`absolute top-[88px] bottom-6 right-6 w-72 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-40 transition-all duration-500 flex flex-col overflow-hidden ${isElementsOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Elements</h3>
                    <button onClick={() => setIsElementsOpen(false)} className="text-muted hover:text-foreground transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                    {/* Element Categories */}
                    <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 px-2">Triggers</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => handleAddNode('Start')}
                                className="bg-black/5 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-lg transition-all active:scale-95 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Start</span>
                            </div>
                            <div
                                onClick={() => handleAddNode('Schedule')}
                                className="bg-black/5 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-lg transition-all active:scale-95 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Schedule</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 px-2">Actions</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div
                                onClick={() => handleAddNode('Request')}
                                className="bg-black/5 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all active:scale-95 group w-full"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex flex-shrink-0 items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">API Request</p>
                                    <p className="text-[9px] font-bold text-muted mt-0.5">Make an HTTP call</p>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted opacity-50"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Drag Hint at bottom */}
                <div className="p-4 bg-primary/5 border-t border-primary/10 flex items-center justify-center gap-2 text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    <p className="text-[9px] font-black uppercase tracking-widest">Click element to spawn</p>
                </div>
            </div>

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
