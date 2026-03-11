"use client";

import { useState, useRef, useEffect } from "react";
import { Flow } from "@/app/lib/collections";
import { getFlowChatResponse } from "@/app/lib/ai/flow-agent";

/**
 * FlowChat Component
 * A contextual AI assistant for API Flows.
 * Powered by Gemini for mission-critical debugging and orchestration.
 */
export default function FlowChat({ flow, embedded = false }: { flow: Flow, embedded?: boolean }) {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: `Commander, Protocol Assistant online for mission "${flow.name}". Systems are nominal. How can I assist with your sequence?` }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        // Prepare history for Gemini
        // Gemini expects history to strictly start with a 'user' role.
        let history = messages.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.content }]
        }));

        if (history.length > 0 && history[0].role === 'model') {
            history = history.slice(1);
        }

        try {
            const response = await getFlowChatResponse(flow, history, userMessage);
            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Neural handshake failed. Please verify your connection to Mission Control." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const chatWindow = (
        <div className={`${embedded ? 'w-full h-full' : 'w-96 h-[600px] shadow-2xl animate-in slide-in-from-bottom-8'} bg-white dark:bg-[#0c1421] rounded-[2.5rem] border border-black/5 dark:border-white/10 flex flex-col overflow-hidden duration-500`}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-black/5 dark:border-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500/50 blur-sm animate-ping" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Protocol Assistant</span>
                        <p className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-60">Status: Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-muted uppercase">Gemini 2.0</div>
                </div>
            </div>

            {/* Message Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] p-4 rounded-3xl text-[12px] font-medium leading-relaxed ${m.role === 'user'
                            ? 'bg-primary text-white rounded-tr-none shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)]'
                            : 'bg-black/5 dark:bg-white/5 text-foreground/80 dark:text-white/80 rounded-tl-none border border-black/5 dark:border-white/5 backdrop-blur-sm'
                            }`}>
                            {m.content.split('\n').map((line, idx) => (
                                <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="p-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/40">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        disabled={isTyping}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isTyping ? "Assessing mission parameters..." : "Initiate neural handshake..."}
                        className="w-full bg-white dark:bg-[#1a2436] text-[12px] text-foreground dark:text-white/90 border border-black/5 dark:border-white/5 rounded-2xl px-5 py-4 pr-14 outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] placeholder:text-muted/40"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className={`absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${input.trim() ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' : 'bg-muted/10 text-muted/30 scale-90'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <div className="mt-3 flex justify-center">
                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Mission Control Link v2.0.4</span>
                </div>
            </div>
        </div>
    );

    return chatWindow;
}
