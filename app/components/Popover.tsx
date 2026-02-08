import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    align?: 'left' | 'right';
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function Popover({
    trigger,
    content,
    align = 'left',
    isOpen,
    onOpenChange
}: PopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onOpenChange]);

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            <div onClick={() => onOpenChange(!isOpen)} className="cursor-pointer inline-flex">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute z-50 mt-2 min-w-[200px] origin-top-right rounded-xl bg-card-bg border border-card-border shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 p-2 ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                >
                    {content}
                </div>
            )}
        </div>
    );
}
