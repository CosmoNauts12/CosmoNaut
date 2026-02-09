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

  // Format JSON response body for display
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

  if (response.error) {
    const { error_type, message } = response.error;
    
    const errorDetails = {
      DNS_ERROR: {
        title: "DNS Resolution Failed",
        desc: "The domain name could not be resolved. Please check the URL spelling or your DNS settings.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
            <path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
          </svg>
        )
      },
      TIMEOUT_ERROR: {
        title: "Mission Timed Out",
        desc: "The server took too long to respond. This might be due to a slow connection or a heavy server-side operation.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/80 mb-6">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M12 6c-3.31 0-6 2.69-6 6"></path>
          </svg>
        )
      },
      SSL_ERROR: {
        title: "Secure Connection Failed",
        desc: "There was a problem establishing a secure SSL/TLS connection. This could be an expired certificate or a protocol mismatch.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><path d="M12 16v-1"></path>
          </svg>
        )
      },
      NETWORK_ERROR: {
        title: "Connection Failed",
        desc: "Could not reach the server. Please check your internet connection or ensuring the server is running.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
            <path d="M1 1l22 22"></path><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><path d="M12 20h.01"></path>
          </svg>
        )
      },
      INVALID_URL: {
        title: "Invalid Protocol",
        desc: "The request terminal could not interpret the protocol. Ensure the URL starts with http:// or https://.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )
      },
      UNKNOWN_ERROR: {
        title: "Unexpected Failure",
        desc: "An unknown anomaly occurred during request execution. Check the console for more details.",
        icon: (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-6">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )
      }
    };

    const details = errorDetails[error_type.toUpperCase() as keyof typeof errorDetails] || errorDetails.UNKNOWN_ERROR;

    return (
      <div className="flex flex-col h-full bg-card-bg/20 backdrop-blur-md border-t border-card-border items-center justify-center p-8 text-center scrollbar-hide">
        {details.icon}
        <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-2">{details.title}</h3>
        <p className="text-xs text-muted font-bold leading-relaxed max-w-md mb-6">{details.desc}</p>
        
        <div className="w-full max-w-lg liquid-glass p-4 rounded-xl border-card-border/50 text-left bg-black/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Technical Insight</p>
          <code className="text-[10px] text-rose-500/80 font-mono break-all">{message}</code>
        </div>
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
