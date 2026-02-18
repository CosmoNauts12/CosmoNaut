"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    defaultValue?: string;
    placeholder?: string;
    submitLabel?: string;
}

/**
 * Prompt Modal Component
 * A replacement for window.prompt().
 */
export default function PromptModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    defaultValue = "",
    placeholder = "",
    submitLabel = "Save"
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);

    // Update value when modal opens or defaultValue changes
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(value);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    autoFocus
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/20 border border-primary/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted/50 transition-all shadow-inner"
                />
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
