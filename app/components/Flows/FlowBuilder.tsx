"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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

    return (
        <div className="flex flex-col h-full bg-[#020617] relative overflow-hidden font-outfit">
            {/* Elegant Background Grid - Canvas Aesthetic */}
            <div className="absolute inset-0 z-0 opacity-[0.2] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle, #38BDF8 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

            {/* Header / Title Area */}
            <div className="px-8 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-primary to-orange-500 p-[1px]">
                        <div className="w-full h-full rounded-[1.2rem] bg-[#020617] flex items-center justify-center text-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-[0.1em] leading-tight mb-0.5">{localFlow.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">Active Protocol</span>
                            <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">• {localFlow.blocks.length} Steps Defined</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${showChat ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <div className="w-px h-8 bg-white/5 mx-2" />
                    <button
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                        onClick={handleAddBlock}
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Execution Summary Notification */}
            {summary && (
                <div className="px-8 z-20 animate-in slide-in-from-top-4 duration-500">
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
            )}

            {/* Canvas Area with Vertical Flow */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide z-10 relative">
                {localFlow.blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center text-white/20 mb-8 transform group-hover:scale-105 transition-transform">
                            <img src="/astro.png" className="w-16 h-16 opacity-40 grayscale" alt="Empty" />
                        </div>
                        <h3 className="text-lg font-black text-white/80 uppercase tracking-[0.2em] mb-3">Initialize your Mission</h3>
                        <p className="text-[11px] text-white/30 font-bold max-w-sm leading-relaxed mb-8 uppercase tracking-tighter">
                            Sequence your requests to automate complex API interactions. Start by adding your first protocol node.
                        </p>
                        <button
                            onClick={handleAddBlock}
                            className="px-10 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
                        >
                            Create First Node
                        </button>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto pb-48">
                        {[...localFlow.blocks].sort((a, b) => a.order - b.order).map((block, index, arr) => (
                            <div key={block.id} className="relative flex flex-col items-center">
                                <div className="w-full">
                                    <FlowBlockUI
                                        block={block}
                                        onUpdateAction={(updates: Partial<FlowBlock>) => handleUpdateBlock(block.id, updates)}
                                        onDeleteAction={(blockId: string) => handleDeleteBlock(blockId)}
                                        onRunAction={(b: FlowBlock) => executor.execute({ ...localFlow, blocks: [b] }, !!isDemo)}
                                        onMoveUpAction={(index: number) => moveBlock(index, 'up')}
                                        onMoveDownAction={(index: number) => moveBlock(index, 'down')}
                                        isFirst={index === 0}
                                        isLast={index === arr.length - 1}
                                        isExecuting={isExecuting}
                                        readOnly={currentRole === 'read'}
                                    />
                                </div>

                                {index < arr.length - 1 && (
                                    <div className="py-4 flex flex-col items-center">
                                        <div className="w-px h-10 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#020617] border border-white/5 rounded-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleAddBlock}
                                className="group flex flex-col items-center gap-4 transition-all"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:border-primary/50 group-hover:bg-primary/5 transition-all group-hover:scale-110 active:scale-90">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-primary/60 transition-colors">Append Protocol Node</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Canva-style Control Bar */}
            {localFlow.blocks.length > 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl shadow-black/50 flex items-center gap-2">
                        <button
                            onClick={runFlow}
                            disabled={isExecuting}
                            className={`h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${isExecuting ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                        >
                            {isExecuting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                            {isExecuting ? 'Executing...' : 'Run Protocol'}
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-1" />

                        <button
                            onClick={handleAddBlock}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white/60 hover:text-white transition-all active:scale-90"
                            title="Add Node"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>

                        <button
                            onClick={() => executor.stop()}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 border border-white/5 rounded-2xl text-white/60 hover:text-rose-400 transition-all active:scale-90"
                            title="Abort Execution"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* AI Chat Drawer */}
            {showChat && (
                <div className="absolute top-0 right-0 bottom-0 w-96 bg-[#0F172A] border-l border-white/10 z-40 animate-in slide-in-from-right duration-500 shadow-2xl shadow-black/50">
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-white/80">Flow Oracle</span>
                            </div>
                            <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <FlowChat flow={localFlow} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
