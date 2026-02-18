"use client";

import React, { useEffect, useState } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}

/**
 * Base Modal Component
 * Provides the backdrop, animation, and container for modal content.
 */
export default function Modal({ isOpen, onClose, children, title, className = "" }: ModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isOpen ? "animate-in fade-in duration-200" : "animate-out fade-out duration-200"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-md liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden flex flex-col p-6 ${isOpen ? "animate-in zoom-in-95 duration-300" : "animate-out zoom-out-95 duration-200"} ${className}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    {(title || onClose) && (
                        <div className="flex items-center justify-between mb-6">
                            {title && <h2 className="text-lg font-black uppercase tracking-widest text-foreground">{title}</h2>}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all ml-auto"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
