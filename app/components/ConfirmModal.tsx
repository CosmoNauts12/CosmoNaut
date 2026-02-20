
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
 * 
 * Used for confirming actions (e.g., delete).
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
            <div className="space-y-4">
                <p className="text-xs text-muted leading-relaxed font-medium">
                    {message}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg ${isDestructive
                            ? "bg-rose-500 shadow-rose-500/20"
                            : "bg-primary shadow-primary/20"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
