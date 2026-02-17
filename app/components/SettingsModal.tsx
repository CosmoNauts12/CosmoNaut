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
  const { user } = useAuth();
  const { workspaces } = useCollections();
  const [activeTab, setActiveTab] = useState("general");

  if (!isSettingsOpen) return null;

  const tabs = [
    { id: "general", label: "General", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
    { id: "profile", label: "Profile", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { id: "shortcuts", label: "Shortcuts", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg> },
  ];

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
        onClick={() => setSettingsOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl h-[600px] liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />

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

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-48 border-r border-card-border/50 bg-black/5 p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              
              {/* General Tab */}
              {activeTab === "general" && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
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
                      className="glass-select rounded-xl px-3 py-1.5 text-xs font-bold focus:border-primary/50"
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
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-4">User Profile</h3>
                   
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full border-4 border-card-bg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                        {user?.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground">{user?.displayName || "Explorer"}</p>
                        <p className="text-xs text-muted font-mono">{user?.email}</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted">Current Status</label>
                     <input 
                        type="text" 
                        value={settings.status || ""} 
                        onChange={(e) => updateSettings({ status: e.target.value })}
                        placeholder="What are you working on?"
                        className="w-full bg-black/10 border border-card-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted/30"
                     />
                     <p className="text-[10px] text-muted font-bold opacity-60">Visible to your team members.</p>
                   </div>
                </div>
              )}

              {/* Shortcuts Tab */}
              {activeTab === "shortcuts" && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-4">Keyboard Shortcuts</h3>
                  
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
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
