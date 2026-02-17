"use client";

import React from "react";
import { useSettings } from "./SettingsProvider";

/**
 * Billing Modal Component
 */
export default function BillingModal() {
  const { isBillingOpen, setBillingOpen } = useSettings();

  if (!isBillingOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setBillingOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Billing & Plan</h3>
             <button
               onClick={() => setBillingOpen(false)}
               className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          </div>

          <div className="bg-white/5 border border-card-border/50 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider">Free Plan</span>
                </div>
                <h4 className="text-lg font-black text-foreground mb-1">Explorer Edition</h4>
                <p className="text-xs text-muted mb-6">Perfect for individual developers and small projects.</p>
                
                <div className="space-y-3 mb-6">
                   {[
                      "Unlimited Collections",
                      "Local Encrypted Storage",
                      "Basic Request Chaining",
                      "Community Support"
                   ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         {feat}
                      </div>
                   ))}
                </div>

                <button className="w-full py-2 bg-gradient-to-r from-primary to-secondary rounded-xl text-xs font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                   Upgrade to Pro (Coming Soon)
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
