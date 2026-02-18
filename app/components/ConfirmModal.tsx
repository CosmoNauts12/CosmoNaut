"use client";

import React from "react";
import Modal from "./Modal";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
}

/**
 * Confirm Modal Component
 * A replacement for window.confirm().
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    isDestructive = false
}: ConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-sm text-muted leading-relaxed font-medium">{message}</p>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all ${isDestructive
                                ? "bg-rose-500 hover:shadow-rose-500/20"
                                : "bg-gradient-to-r from-primary to-secondary hover:shadow-primary/20"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
