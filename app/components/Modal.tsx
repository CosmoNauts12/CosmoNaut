
import React, { useEffect, useRef } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

/**
 * Base Modal Component
 * 
 * Provides a standardized modal layout with backdrop, animation, and close behavior.
 */
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Click outside to close is handled by the backdrop overlay

    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    // Use createPortal to render outside the current DOM hierarchy (e.g., inside Sidebar)
    // This allows fixed positioning to work relative to the viewport, not a transformed parent.
    const { createPortal } = require("react-dom");

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className="relative w-full max-w-md bg-white dark:bg-[#020617] liquid-glass border border-card-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-card-border/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
