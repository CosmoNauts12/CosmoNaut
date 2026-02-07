"use client";

import { useState, useMemo } from "react";
import { CosmoResponse } from "./RequestEngine";

export default function ResponsePanel({ 
  response, 
  isExecuting 
}: { 
  response: CosmoResponse | null;
  isExecuting: boolean;
}) {
  const [activeTab, setActiveTab] = useState("pretty");
  const [visualMode, setVisualMode] = useState("graph");

  const formattedBody = useMemo(() => {
    if (!response) return null;
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2);
    } catch (e) {
      return response.body;
    }
  }, [response]);

  if (isExecuting) {
    return (
      <div className="flex flex-col h-full bg-card-bg/10 backdrop-blur-md border-t border-card-border items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Executing Mission...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col h-full bg-card-bg/10 backdrop-blur-md border-t border-card-border items-center justify-center opacity-30">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Awaiting Data Pipeline</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card-bg/10 backdrop-blur-md border-t border-card-border overflow-hidden">
      {/* Response Header */}
      <div className="h-10 px-4 border-b border-card-border/50 flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("pretty")}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pretty' ? 'text-primary' : 'text-muted'}`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab("visualize")}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visualize' ? 'text-primary' : 'text-muted'}`}
          >
            Visualize
          </button>
        </div>

        <div className="flex gap-4 text-[10px] font-bold">
          <span className={`${response.status >= 200 && response.status < 300 ? 'text-emerald-500' : 'text-rose-500'}`}>
            Status: <span className="text-foreground">{response.status}</span>
          </span>
          <span className="text-muted">Time: <span className="text-foreground">{response.duration_ms} ms</span></span>
          <span className="text-muted">Size: <span className="text-foreground">{(response.body.length / 1024).toFixed(2)} KB</span></span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {activeTab === 'pretty' && (
          <div className="liquid-glass p-6 rounded-2xl border-card-border/50 shadow-inner overflow-x-auto min-h-full">
            <pre className="text-primary/90 whitespace-pre-wrap">
              {formattedBody}
            </pre>
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted">Visualization requires specific data mission protocols</p>
          </div>
        )}
      </div>
    </div>
  );
}
