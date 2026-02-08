import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type?: 'input' | 'confirm' | 'alert';
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value?: string) => void;
    message?: string;
    children?: React.ReactNode;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    type = 'input',
    defaultValue = '',
    placeholder = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    message,
    children
}: ModalProps) {
    const [inputValue, setInputValue] = React.useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
            // Focus input on open if type is input
            if (type === 'input') {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        }
    }, [isOpen, defaultValue, type]);

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        onConfirm(type === 'input' ? inputValue : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-card-bg border border-card-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>

                    {message && (
                        <p className="text-sm text-muted mb-4">{message}</p>
                    )}

                    {children}

                    {type === 'input' && (
                        <form onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-4 py-2 bg-background border border-input-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                        </form>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all ${type === 'confirm' && title.toLowerCase().includes('delete')
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
