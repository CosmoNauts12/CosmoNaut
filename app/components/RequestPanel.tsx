"use client";

import { useState } from "react";

import { useSettings } from "./SettingsProvider";

const methods = ["GET", "POST", "PUT", "DELETE"];

export default function RequestPanel() {
  const { settings } = useSettings();
  const [method, setMethod] = useState(settings.defaultMethod);
  const [url, setUrl] = useState("https://api.cosmonaut.io/v1/user");
  const [activeTab, setActiveTab] = useState("params");

  return (
    <div className="flex flex-col h-full bg-card-bg/20 backdrop-blur-sm">
      {/* Search/URL Bar */}
      <div className="p-4 border-b border-card-border bg-black/5 dark:bg-white/5 space-y-4">
        <div className="flex gap-2">
          <div className="relative group">
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className={`h-11 px-4 rounded-xl border border-card-border/50 bg-card-bg font-black text-xs appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-all ${
                method === 'GET' ? 'text-emerald-500' : 
                method === 'POST' ? 'text-amber-500' :
                method === 'PUT' ? 'text-blue-500' : 'text-rose-500'
              }`}
            >
              {methods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted opacity-50">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 h-11 px-4 rounded-xl border border-card-border/50 bg-card-bg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
          />

          <button className="h-11 px-8 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
            Send
          </button>
        </div>

        {/* Request Tabs */}
        <div className="flex gap-4">
          {['Params', 'Auth', 'Headers', 'Body'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all relative ${
                activeTab === tab.toLowerCase() ? 'text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Stubs */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center opacity-50">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Request {activeTab} Configuration</p>
      </div>
    </div>
  );
}
