"use client";

import React from "react";

/**
 * FlowLoadingOverlay
 * 
 * Displays a full-screen loading state with a progress indicator.
 * All animations and special effects are handled via classes in globals.css.
 */
export default function FlowLoadingOverlay() {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center">
                {/* Animated Loading Bars Icon */}
                <div className="flex items-center gap-1.5 mb-6 h-12">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 bg-primary rounded-full animate-bounce"
                            style={{
                                height: i === 1 ? '100%' : '60%',
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: '1s'
                            }}
                        />
                    ))}
                </div>

                <div className="text-center">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-widest mb-2">New Flow</h3>
                    <p className="text-xs text-muted font-bold tracking-tight flex items-center justify-center gap-1.5 opacity-80">
                        <span className="text-muted/50">Hang tight!</span> We are processing your request...
                    </p>
                </div>

                {/* Cinematic Progress Bar */}
                <div className="w-64 h-1.5 bg-foreground/5 rounded-full mt-10 overflow-hidden relative border border-white/5">
                    <div className="absolute inset-y-0 left-0 bg-primary w-[65%] animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-shimmer" />
                </div>
            </div>
        </div>
    );
}
