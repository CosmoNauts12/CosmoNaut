"use client";

import React from "react";
import AstronautWorkflow from "./AstronautWorkflow";

interface FlowsLandingProps {
    onCreateFlow: () => void;
}

/**
 * FlowsLanding Component
 * 
 * Displays the empty state for the Flows section.
 * Inspired by Postman's flow landing page.
 */
export default function FlowsLanding({ onCreateFlow }: FlowsLandingProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-[280px] h-[280px] mb-6 group transition-transform duration-700 hover:scale-105 flex items-center justify-center">
                {/* Glow effect behind the astronaut */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />

                {isPlaying ? (
                    <div className="relative z-10 w-full h-full">
                        <AstronautWorkflow width={280} height={280} />
                    </div>
                ) : (
                    <img
                        src="/robot.png"
                        alt="Create first Flow"
                        className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-500"
                    />
                )}

                {/* Decorative elements */}
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all duration-300 z-20 ${isPlaying
                        ? 'bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] rotate-90'
                        : 'bg-secondary/20 border-secondary/30 hover:bg-secondary/30 animate-bounce duration-[3000ms]'
                        }`}
                >
                    {isPlaying ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}
                </button>

                <div className="absolute -bottom-2 -left-6 w-16 h-10 bg-primary/10 rounded-lg backdrop-blur-sm border border-primary/20 flex items-center justify-center animate-pulse">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-20" />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight uppercase tracking-[0.05em]">
                Create your first Flow
            </h2>

            <p className="text-sm text-muted mb-10 max-w-sm font-medium leading-relaxed">
                Use Flows to visualize, test, and automate complex API request workflows in a visual environment.
            </p>

            <button
                onClick={onCreateFlow}
                className="px-10 py-4 bg-gradient-to-r from-primary via-primary to-orange-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all group"
            >
                <span className="flex items-center gap-3">
                    Create Flow
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </span>
            </button>

            {/* Matching the design from Image 1 */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
                {[
                    { title: "Visualize", desc: "See your API steps in a clear vertical flow." },
                    { title: "Automate", desc: "Chain requests and pass data between steps." },
                    { title: "Debug", desc: "Identify failures at a glance in the execution log." }
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border border-card-border bg-card-bg/50 text-left">
                        <h4 className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">{item.title}</h4>
                        <p className="text-[10px] text-muted font-bold leading-tight">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
