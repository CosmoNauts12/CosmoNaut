"use client";

import React from "react";

interface FlowsLandingProps {
    onCreateFlow: () => void;
    onExploreTemplates: () => void;
}

/**
 * FlowsLanding Component
 * 
 * Displays the empty state for the Flows section.
 * Inspired by Postman's flow landing page.
 */
export default function FlowsLanding({ onCreateFlow, onExploreTemplates }: FlowsLandingProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-64 h-64 mb-8 group transition-transform duration-700 hover:scale-110">
                {/* Glow effect behind the astronaut */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />

                <img
                    src="/astro.png"
                    alt="Welcome to Flows"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                />

                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary/20 rounded-xl backdrop-blur-md border border-secondary/30 flex items-center justify-center animate-bounce duration-[3000ms]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/70">
                Welcome to Flows
            </h2>

            <p className="text-sm text-muted mb-10 max-w-sm font-medium leading-relaxed">
                Flows allow you to visually design, test, and automate complex API workflows in a dynamic environment.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={onCreateFlow}
                    className="px-10 py-4 glass-btn-primary text-white font-semibold text-sm rounded-2xl flex items-center gap-3 transition-all group"
                >
                    <span className="flex items-center gap-3">
                        Create Your First Flow
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </span>
                </button>

                <button
                    onClick={onExploreTemplates}
                    className="px-8 py-4 bg-background/50 border border-card-border hover:border-secondary/50 text-foreground font-semibold text-sm rounded-2xl hover:bg-secondary/5 transition-all group flex items-center gap-3"
                >
                    Explore Templates
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            {/* Feature Highlights */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
                {[
                    { title: "Visualize", desc: "See your API steps in a clear vertical flow." },
                    { title: "Automate", desc: "Chain requests and pass data between steps." },
                    { title: "Debug", desc: "Identify failures at a glance in the execution log." }
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border border-card-border bg-card-bg/50 text-left liquid-glass hover:border-primary/30 transition-colors">
                        <h4 className="text-xs font-semibold text-primary mb-1 tracking-wide">{item.title}</h4>
                        <p className="text-xs text-muted font-medium leading-tight">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
