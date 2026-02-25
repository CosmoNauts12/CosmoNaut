"use client";

import { useState } from "react";
import { Flow, FlowBlock } from "@/app/lib/collections";

/**
 * FlowChat Component
 * A contextual AI assistant for API Flows.
 * Provides suggestions, error explanations, and automated flow generation.
 */
export default function FlowChat({ flow, embedded = false }: { flow: Flow, embedded?: boolean }) {
    const [isOpen, setIsOpen] = useState(embedded);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: `I'm monitoring your mission protocol "${flow.name}". How can I assist with your sequence?` }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const currentInput = input;
        setInput("");

        // Simulate AI response
        setTimeout(() => {
            let response = "";
            const lowerInput = currentInput.toLowerCase();

            if (lowerInput.includes("fix") || lowerInput.includes("error")) {
                const errorBlock = flow.blocks.find(b => b.error);
                if (errorBlock) {
                    response = `I see an error in step ${errorBlock.order + 1} ("${errorBlock.name}"). It returned ${errorBlock.status}. This usually means the endpoint requires additional authentication or the parameters are malformed. Should I try to fix it?`;
                } else {
                    response = "All steps seem to be configured correctly. Try running the flow to identify any runtime issues.";
                }
            } else if (lowerInput.includes("add") || lowerInput.includes("next")) {
                response = "To add a new step, click the (+) button at the bottom of the canvas. I can also generate a step if you tell me which API you want to call.";
            } else if (lowerInput.includes("how are you") || lowerInput.includes("how are u") || lowerInput.includes("hello") || lowerInput.includes("hi")) {
                response = "Systems are nominal. I'm monitoring your mission protocol and ready to assist. How is the sequence looking on your end?";
            } else if (lowerInput.includes("help") || lowerInput.includes("can you do") || lowerInput.includes("what can you")) {
                response = "I'm your Mission Control specialist. I can help you debug errors, suggest headers, or even generate entire sequences based on your description. What's the next objective?";
            } else if (lowerInput === "yes" || lowerInput === "ok" || lowerInput === "sure") {
                response = "Acknowledged. Proceeding with the protocol. Let me know if you need specific adjustments.";
            } else {
                response = "I've logged that. I'm standing by to help with debugging, header suggestions, or sequence generation whenever you're ready.";
            }

            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        }, 800);
    };

    const chatWindow = (
        <div className={`${embedded ? 'w-full h-full' : 'w-80 h-[450px] shadow-2xl animate-in slide-in-from-bottom-4'} bg-white dark:bg-[#1E1E1E] rounded-[2rem] border border-black/5 dark:border-white/10 flex flex-col overflow-hidden duration-300`}>
            {!embedded && (
                <div className="p-4 bg-primary/10 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Assistant</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' : 'bg-foreground/5 dark:bg-[#181818] text-foreground/80 rounded-tl-none border border-black/5 dark:border-white/5'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-black/5 dark:border-white/5 bg-foreground/5 dark:bg-black/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask your assistant..."
                        className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted/50"
                    />
                    <button
                        onClick={handleSend}
                        className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );

    if (embedded) return chatWindow;

    return (
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
            {isOpen && chatWindow}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isOpen ? 'bg-card-bg rotate-90 border-card-border' : 'bg-primary text-white hover:scale-110 shadow-primary/40'
                    }`}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                )}
            </button>
        </div>
    );
}
