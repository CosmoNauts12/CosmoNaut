"use client";

import React from "react";
import { useSettings } from "./SettingsProvider";
import { useCollections } from "./CollectionsProvider";

/**
 * Modal component for editing user preferences.
 * Provides a categorized interface for managing:
 * - Default workspace selection.
 * - Interaction toggles (launch behavior, safety confirmations).
 * - Request builder defaults (HTTP methods).
 * Uses liquid-glass aesthetics and smooth state transitions.
 */
export default function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen, settings, updateSettings } = useSettings();
  const { workspaces } = useCollections();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-card-border flex items-center justify-between bg-white/5">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* General Section */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">General</h3>

              {/* Default Workspace */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">Default Workspace</p>
                  <p className="text-[10px] text-muted font-bold">Workspace to open on launch if enabled</p>
                </div>
                <select
                  value={settings.defaultWorkspace}
                  onChange={(e) => updateSettings({ defaultWorkspace: e.target.value })}
                  className="glass-select rounded-xl px-3 py-1.5 text-xs font-bold focus:border-primary/50"
                >
                  <option value="none">None</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                {[
                  { id: 'openLastWorkspace', label: 'Open Last Workspace', desc: 'Reopen where you left off' },
                  { id: 'confirmCloseTab', label: 'Confirm Before Closing Tabs', desc: 'Avoid accidental data loss' },
                  { id: 'confirmDelete', label: 'Confirm Before Deleting', desc: 'Extra safety for your missions' },
                ].map((toggle) => (
                  <div key={toggle.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground">{toggle.label}</p>
                      <p className="text-[10px] text-muted font-bold">{toggle.desc}</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ [toggle.id]: !settings[toggle.id as keyof typeof settings] })}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${settings[toggle.id as keyof typeof settings] ? 'bg-primary' : 'bg-white/10'
                        }`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${settings[toggle.id as keyof typeof settings] ? 'left-6' : 'left-1'
                        }`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Request Settings */}
            <section className="space-y-6 pt-6 border-t border-card-border/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/70">Request Defaults</h3>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">Default Method</p>
                  <p className="text-[10px] text-muted font-bold">Applied to all new requests</p>
                </div>
                <div className="flex bg-card-bg/50 rounded-xl border border-card-border p-1">
                  {['GET', 'POST'].map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ defaultMethod: m as 'GET' | 'POST' })}
                      className={`px-4 py-1 rounded-lg text-[10px] font-black transition-all ${settings.defaultMethod === m
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-muted hover:text-foreground'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/5 border-t border-card-border flex justify-end">
            <button
              onClick={() => setSettingsOpen(false)}
              className="glass-btn-primary px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
