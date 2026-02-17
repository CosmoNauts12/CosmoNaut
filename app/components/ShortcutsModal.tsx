"use client";

import React from "react";
import { useSettings } from "./SettingsProvider";

/**
 * Shortcuts Modal Component
 */
export default function ShortcutsModal() {
  const { isShortcutsOpen, setShortcutsOpen } = useSettings();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "Ctrl + S", description: "Save current request" },
    { key: "Ctrl + Enter", description: "Send request" },
    { key: "Ctrl + N", description: "New request" },
    { key: "Ctrl + W", description: "Close tab" },
    { key: "Ctrl + /", description: "Toggle sidebar" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setShortcutsOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Keyboard Shortcuts</h3>
             <button
               onClick={() => setShortcutsOpen(false)}
               className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="bg-white/5 border border-card-border/50 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span className="text-xs font-bold text-foreground/80">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-black/20 rounded text-[10px] font-mono font-bold text-primary border border-card-border/50 min-w-[60px] text-center shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
