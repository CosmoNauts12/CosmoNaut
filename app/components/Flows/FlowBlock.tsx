"use client";

import React, { useState, useEffect, useRef } from "react";
import { FlowBlock, KVItem } from "@/app/lib/collections";

const methods = ["GET", "POST", "PUT", "DELETE"];

/**
 * FlowBlockUI Component
 * 
 * Re-designed to match Postman Flows aesthetic.
 * Features: Orange accent, side ports, and compact configuration.
 */
export default function FlowBlockUI({
    block,
    onUpdateAction,
    onDeleteAction,
    onRunAction,
    isExecuting = false,
    readOnly = false,
    onDragStartAction
}: {
    block: FlowBlock;
    onUpdateAction: (updates: Partial<FlowBlock>) => void;
    onDeleteAction: (blockId: string) => void;
    onRunAction: (block: FlowBlock) => void;
    isExecuting?: boolean;
    readOnly?: boolean;
    onDragStartAction?: (e: React.MouseEvent) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
    const [showTriggerMenu, setShowTriggerMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowTriggerMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);



    const handleKVChange = (field: 'params' | 'headers', index: number, updates: Partial<KVItem>) => {
        const newList = [...(field === 'params' ? block.params : block.headers)];
        newList[index] = { ...newList[index], ...updates };
        if (index === newList.length - 1 && (updates.key || updates.value)) {
            newList.push({ key: '', value: '', enabled: true });
        }
        onUpdateAction({ [field]: newList });
    };

    const removeKV = (field: 'params' | 'headers', index: number) => {
        const newList = [...(field === 'params' ? block.params : block.headers)];
        if (newList.length > 1) {
            newList.splice(index, 1);
            onUpdateAction({ [field]: newList });
        }
    };

    const triggerOptions = [
        { name: 'Start', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg> },
        { name: 'Request', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
        { name: 'Schedule', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> }
    ];

    return (
        <div className="flex flex-col items-center group/node">
            <div className={`relative w-[450px] bg-[#1E1E1E] rounded-xl border border-white/10 shadow-2xl transition-all duration-300 ${block.isExecuting ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#020617]' : ''} overflow-visible`}>

                {/* Postman-Style Orange/Blue Accent Side */}
                {/* Postman-Style Blue Accent Side */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-[#00A5FF]`} />

                {/* Node Header */}
                <div
                    className="pl-4 pr-3 py-3 flex items-center justify-between border-b border-white/5 cursor-grab active:cursor-grabbing"
                    onClick={() => setIsExpanded(!isExpanded)}
                    onMouseDown={onDragStartAction}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                        {triggerOptions.find(opt => opt.name === block.name)?.icon || triggerOptions[0].icon}
                        <input
                            type="text"
                            value={block.name}
                            onChange={(e) => onUpdateAction({ name: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent font-bold text-sm text-white/90 outline-none w-full"
                            placeholder="Node Name"
                        />
                    </div>

                    <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()} ref={menuRef}>
                        <button
                            onClick={() => setShowTriggerMenu(!showTriggerMenu)}
                            className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded transition-colors group"
                        >
                            Change trigger
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${showTriggerMenu ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>

                        {/* Trigger Selection Menu */}
                        {showTriggerMenu && (
                            <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-[#252525] border border-white/10 rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                {triggerOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => {
                                            onUpdateAction({ name: option.name });
                                            setShowTriggerMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/5 group/opt"
                                    >
                                        <span className={`w-4 flex justify-center ${block.name === option.name ? 'text-white' : 'text-transparent'}`}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </span>
                                        <span className={`flex-shrink-0 ${block.name === option.name ? 'text-white' : 'text-white/40 group-hover/opt:text-white/60'}`}>
                                            {option.icon}
                                        </span>
                                        <span className={block.name === option.name ? 'text-white' : 'text-white/60 group-hover/opt:text-white'}>
                                            {option.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 ml-2">
                            <button onClick={() => onRunAction(block)} className="p-1.5 hover:bg-primary/20 text-white/30 hover:text-primary transition-all rounded-md">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </button>
                            <button onClick={() => onDeleteAction(block.id)} className="p-1.5 hover:bg-rose-500/20 text-white/30 hover:text-rose-500 transition-all rounded-md">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Node Body / Config */}
                {isExpanded && (
                    <div className="p-4 py-8 space-y-6 flex flex-col justify-center min-h-[120px]">
                        {block.name === 'Request' ? (
                            /* Specific "Request" Body Style from Reference Image */
                            <div className="flex flex-col items-end space-y-4 pr-1">
                                {['Headers', 'Params', 'Body'].map((item) => (
                                    <div key={item} className="group/item flex items-center gap-3 relative">
                                        <span className="text-sm font-medium text-white/90">{item} ( )</span>
                                        <div className="w-3 h-3 bg-white/20 rounded-full border-2 border-[#1E1E1E] group-hover/item:bg-primary transition-colors cursor-crosshair" />
                                        {/* Port Glow */}
                                        <div className="absolute -right-1 w-2 h-2 bg-primary/40 rounded-full blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        ) : block.name === 'Schedule' ? (
                            /* "Schedule" Style from Reference Image */
                            <div className="flex flex-col space-y-4">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-white/50">Describe when the flow should run</p>
                                    <div className="relative group/input" onMouseDown={(e) => e.stopPropagation()}>
                                        <textarea
                                            placeholder="e.g., Run every Monday at 2pm EST"
                                            className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-6 text-sm text-white/60 placeholder:text-white/20 outline-none focus:border-white/20 transition-all resize-none h-32"
                                        />
                                        <button className="absolute bottom-3 right-3 bg-[#422B22] hover:bg-[#523B32] text-[#FF5C35] px-4 py-1.5 rounded-md text-[11px] font-bold transition-colors">
                                            Apply
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end mt-4 group/item relative">
                                    <span className="text-sm font-medium text-white/90">Timestamp ( )</span>
                                    <div className="w-3 h-3 bg-white/20 rounded-full border-2 border-[#1E1E1E] group-hover/item:bg-primary transition-colors cursor-crosshair" />
                                </div>
                            </div>
                        ) : block.name === 'Start' ? (
                            /* "Start" Style */
                            <div className="flex flex-col space-y-4">
                                <button className="text-[11px] font-bold text-white/40 hover:text-white flex items-center gap-2 transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Add input
                                </button>
                                <div className="flex items-center gap-3 self-end mt-4 group/item relative">
                                    <span className="text-sm font-medium text-white/90">Output ( )</span>
                                    <div className="w-3 h-3 bg-white/20 rounded-full border-2 border-[#1E1E1E] group-hover/item:bg-primary transition-colors cursor-crosshair" />
                                </div>
                            </div>
                        ) : (
                            /* Default Configuration Style */
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <button className="text-[11px] font-bold text-white/40 hover:text-white flex items-center gap-2 transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        Add input
                                    </button>
                                </div>
                                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={block.url}
                                        onChange={(e) => onUpdateAction({ url: e.target.value })}
                                        placeholder="https://api.domain.com/endpoint"
                                        className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white/80 focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3" onMouseDown={(e) => e.stopPropagation()}>
                                    <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Params</p>
                                        {block.params.slice(0, 2).map((p, i) => (
                                            <div key={i} className="flex gap-2 mb-1.5">
                                                <input value={p.key} onChange={(e) => handleKVChange('params', i, { key: e.target.value })} className="min-w-0 flex-1 bg-white/5 border-none rounded px-2 py-1 text-[10px] text-white/60 outline-none" placeholder="Key" />
                                                <input value={p.value} onChange={(e) => handleKVChange('params', i, { value: e.target.value })} className="min-w-0 flex-1 bg-white/5 border-none rounded px-2 py-1 text-[10px] text-white/60 outline-none" placeholder="Value" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Headers</p>
                                        {block.headers.slice(0, 2).map((h, i) => (
                                            <div key={i} className="flex gap-2 mb-1.5">
                                                <input value={h.key} onChange={(e) => handleKVChange('headers', i, { key: e.target.value })} className="min-w-0 flex-1 bg-white/5 border-none rounded px-2 py-1 text-[10px] text-white/60 outline-none" placeholder="Name" />
                                                <input value={h.value} onChange={(e) => handleKVChange('headers', i, { value: e.target.value })} className="min-w-0 flex-1 bg-white/5 border-none rounded px-2 py-1 text-[10px] text-white/60 outline-none" placeholder="Value" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Bar / Output Footer */}
                {['Start', 'Request', 'Schedule'].includes(block.name) ? (
                    <div className="bg-[#181818] px-4 py-2 flex items-center justify-between border-t border-white/5 rounded-b-xl">
                        <span className="text-xs font-bold text-white/80">Output</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40 cursor-pointer hover:text-white transition-colors"><path d="M7 10h10M12 21v-8M9 4h6a2 2 0 0 1 2 2v2H7V6a2 2 0 0 1 2-2z"></path></svg>
                    </div>
                ) : (
                    /* Default Input/Output Tab Bar */
                    <div className="bg-[#181818] flex border-t border-white/5 rounded-b-xl overflow-hidden">
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'input' ? 'text-white border-b-2 border-primary' : 'text-white/20 hover:text-white/40'}`}
                        >
                            Input
                        </button>
                        <button
                            onClick={() => setActiveTab('output')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'output' ? 'text-white border-b-2 border-primary' : 'text-white/20 hover:text-white/40'}`}
                        >
                            Output
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
