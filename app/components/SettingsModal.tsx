"use client";

import React, { useState } from "react";
import { useSettings } from "./SettingsProvider";
import { useAuth } from "./AuthProvider";
import { useCollections } from "./CollectionsProvider";

/**
 * Modal component for editing user preferences.
 * Provides a categorized interface for managing:
 * - General Settings
 * - User Profile & Status
 * - Keyboard Shortcuts
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
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
              {/* General Preferences Heading */}
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-4">General Preferences</h3>

              {/* Default Workspace */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">Default Workspace</p>
                  <p className="text-[10px] text-muted font-bold">Workspace to open on launch</p>
                </div>
                <select
                  value={settings.defaultWorkspace}
                  onChange={(e) => updateSettings({ defaultWorkspace: e.target.value })}
                  className="glass-select rounded-xl px-3 py-1.5 text-xs font-bold focus:border-primary/50 max-w-[150px]"
                >
                  <option value="none">None</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Request Defaults */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">Default Method</p>
                  <p className="text-[10px] text-muted font-bold">Applied to new requests</p>
                </div>
                <div className="flex bg-card-bg/50 rounded-xl border border-card-border p-1">
                  {['GET', 'POST'].map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ defaultMethod: m as 'GET' | 'POST' })}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${settings.defaultMethod === m
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-muted hover:text-foreground'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-card-border/50" />

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
                      className={`w-9 h-5 rounded-full relative transition-all duration-300 ${settings[toggle.id as keyof typeof settings] ? 'bg-primary' : 'bg-white/10'
                        }`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${settings[toggle.id as keyof typeof settings] ? 'left-5' : 'left-1'
                        }`} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
