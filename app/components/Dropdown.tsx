import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export default function Dropdown({
    trigger,
    children,
    align = 'left'
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block text-left w-full" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute z-50 mt-2 w-full min-w-[200px] origin-top-right rounded-xl bg-[#0f172a] border border-[#1e293b] shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {React.Children.map(children, (child) => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(child, {
                                    onClick: (e: any) => {
                                        if (child.props.onClick) child.props.onClick(e);
                                        setIsOpen(false);
                                    }
                                } as any);
                            }
                            return child;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

interface DropdownItemProps {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export function DropdownItem({ onClick, children, className = "", icon }: DropdownItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors flex items-center gap-3 ${className}`}
            role="menuitem"
        >
            {icon && <span className="text-slate-400">{icon}</span>}
            {children}
        </button>
    );
}

export function DropdownSeparator() {
    return <div className="h-px bg-[#1e293b] my-1" />;
}
