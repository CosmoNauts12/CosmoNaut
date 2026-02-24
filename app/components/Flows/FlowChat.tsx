"use client";

import { useState } from "react";
import { Flow, FlowBlock } from "@/app/lib/collections";

/**
 * FlowChat Component
 * A contextual AI assistant for API Flows.
 * Provides suggestions, error explanations, and automated flow generation.
 */
export default function FlowChat({ flow }: { flow: Flow }) {
    const [isOpen, setIsOpen] = useState(false);
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
            let response = "I'm analyzing your request...";
            if (currentInput.toLowerCase().includes("fix") || currentInput.toLowerCase().includes("error")) {
                const errorBlock = flow.blocks.find(b => b.error);
                if (errorBlock) {
                    response = `I see an error in step ${errorBlock.order + 1} ("${errorBlock.name}"). It returned ${errorBlock.status}. This usually means the endpoint requires additional authentication or the parameters are malformed. Should I try to fix it?`;
                } else {
                    response = "All steps seem to be configured correctly. Try running the flow to identify any runtime issues.";
                }
            } else if (currentInput.toLowerCase().includes("add") || currentInput.toLowerCase().includes("next")) {
                response = "To add a new step, click the (+) button at the bottom of the canvas. I can also generate a step if you tell me which API you want to call.";
            } else {
                response = "I can help you debug errors, suggest headers, or even generate entire sequences based on your description. What would you like to do next?";
            }

            setMessages(prev => [...prev, { role: 'ai', content: response }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
            {isOpen && (
                <div className="w-80 h-[450px] liquid-glass rounded-[2rem] border-primary/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 bg-primary/10 border-b border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-foreground/5 text-foreground/80 rounded-tl-none border border-card-border/30'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-card-border/30 bg-black/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask your assistant..."
                                className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted/50"
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
            )}

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
