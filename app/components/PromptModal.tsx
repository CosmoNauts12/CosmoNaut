
import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    initialValue?: string;
    placeholder?: string;
    submitLabel?: string;
}

/**
 * Prompt Modal Component
 * 
 * Used for getting text input from the user (e.g., creating/renaming items).
 */
export default function PromptModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    initialValue = "",
    placeholder = "",
    submitLabel = "Save"
}: PromptModalProps) {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset value when modal opens
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue(initialValue);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError("");
            // Focus input after a short delay to allow animation
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) {
            setError("Value cannot be empty");
            return;
        }
        onSubmit(value.trim());
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
                <div className="space-y-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder={placeholder}
                        className={`w-full h-10 px-3 rounded-xl border bg-black/5 dark:bg-white/5 text-foreground text-sm focus:outline-none transition-all placeholder:text-muted/50 ${error
                            ? "border-rose-500 focus:border-rose-500 flex"
                            : "border-card-border focus:border-primary/50"
                            }`}
                    />
                    {error && <p className="text-[10px] text-rose-500 font-bold ml-1">{error}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
