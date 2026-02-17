"use client";

import React from "react";
import { useSettings } from "./SettingsProvider";
import { useAuth } from "./AuthProvider";

/**
 * Profile Modal Component
 */
export default function ProfileModal() {
  const { isProfileOpen, setProfileOpen, settings, updateSettings } = useSettings();
  const { user } = useAuth();

  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setProfileOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black uppercase tracking-widest text-foreground">User Profile</h3>
             <button
               onClick={() => setProfileOpen(false)}
               className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>
          
           <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-card-bg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {user?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-2xl font-black text-foreground mb-1">{user?.displayName || "Explorer"}</p>
                <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-bold text-primary border border-primary/20">PRO USER</span>
                   <p className="text-xs text-muted font-mono">{user?.email}</p>
                </div>
              </div>
           </div>

           <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted">Current Status</label>
               <input 
                  type="text" 
                  value={settings.status || ""} 
                  onChange={(e) => updateSettings({ status: e.target.value })}
                  placeholder="What are you working on?"
                  autoFocus
                  className="w-full bg-black/10 border border-card-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted/30"
               />
               <p className="text-[10px] text-muted font-bold opacity-60">Visible to your team members.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
