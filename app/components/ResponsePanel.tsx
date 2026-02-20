"use client";

import { useState, useMemo } from "react";
import { CosmoResponse } from "./RequestEngine";

/**
 * Component for displaying HTTP response data.
 * Features automatic JSON formatting, error classification, and timing metadata.
 * 
 * @param response The response object from the engine, or null if no request sent.
 * @param isExecuting Boolean reflecting the current execution state.
 */

/**
 * Map of error types to user-friendly titles, descriptions, and icons.
 */
const ERROR_DETAILS = {
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

export default function ResponsePanel({
  response,
  isExecuting
}: {
  response: CosmoResponse | null;
  isExecuting: boolean;
}) {
  const [activeTab, setActiveTab] = useState("pretty");
  const [format, setFormat] = useState<"json" | "xml" | "html" | "javascript" | "raw">("json");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formats = [
    { id: 'json', name: 'JSON', icon: <span className="text-[10px] w-4 font-bold">{ }</span> },
    { id: 'xml', name: 'XML', icon: <span className="text-[10px] w-4 font-bold">&lt;/&gt;</span> },
    { id: 'html', name: 'HTML', icon: <span className="text-[10px] w-4 font-bold">&lt;!&gt;</span> },
    { id: 'javascript', name: 'JavaScript', icon: <span className="text-[10px] w-4 font-bold">JS</span> },
    { id: 'raw', name: 'Raw', icon: <span className="text-[10px] w-4 font-bold">TXT</span> },
  ];

  /**
   * Memoized formatted body based on selected format.
   */
  const formattedBody = useMemo(() => {
    if (!response) return null;
    const body = response.body;

    if (format === 'json') {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch (e) {
        return body;
      }
    }

    // For XML/HTML/JS, we just return the body for now, but in a real app
    // we might use a library like 'prettier' or a specific highlighter.
    return body;
  }, [response, format]);

  if (isExecuting) {
    return (
      <div className="flex flex-col h-full bg-card-bg/5 backdrop-blur-xl border-t border-card-border items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analyzing Signal...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col h-full bg-card-bg/5 backdrop-blur-xl border-t border-card-border items-center justify-center opacity-30">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-4 animate-float"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Awaiting Data Pipeline</p>
      </div>
    );
  }

  if (response.error) {
    const { error_type, message } = response.error;
    const details = ERROR_DETAILS[error_type.toUpperCase() as keyof typeof ERROR_DETAILS] || ERROR_DETAILS.UNKNOWN_ERROR;

    return (
      <div className="flex flex-col h-full bg-card-bg/10 backdrop-blur-xl border-t border-card-border items-center justify-center p-8 text-center overflow-y-auto">
        {details.icon}
        <h3 className="text-xl font-black uppercase tracking-widest text-foreground mb-3">{details.title}</h3>
        <p className="text-xs text-muted font-bold leading-relaxed max-w-sm mb-8">{details.desc}</p>

        <div className="w-full max-w-md liquid-glass p-5 rounded-2xl border border-rose-500/20 text-left bg-rose-500/5 shadow-lg shadow-rose-500/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Error Log
          </p>
          <code className="text-[10px] text-rose-500/90 font-mono break-all leading-relaxed">{message}</code>
        </div>
      </div>
    );
  }

  const getStatusLabel = (code: number) => {
    const labels: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Server Error'
    };
    return labels[code] || '';
  };

  return (
    <div className="flex flex-col h-full bg-card-bg/5 backdrop-blur-xl border-t border-card-border overflow-hidden">
      {/* Response Header */}
      <div className="h-12 px-4 border-b border-card-border/50 flex items-center justify-between bg-black/10 dark:bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("pretty")}
              className={`px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'pretty' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
            >
              Body
            </button>
            <button
              onClick={() => setActiveTab("visualize")}
              className={`px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'visualize' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
            >
              Preview
            </button>
          </div>

          <div className="w-[1px] h-4 bg-muted/20" />

          {/* Format Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[12px] font-bold text-foreground/80 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/10"
            >
              <span className="text-primary/70">{formats.find(f => f.id === format)?.icon}</span>
              <span className="uppercase tracking-wider">{formats.find(f => f.id === format)?.name}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFormat(f.id as any);
                        setIsDropdownOpen(false);
                        setActiveTab("pretty");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold uppercase transition-all ${format === f.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}`}
                    >
                      <span className={format === f.id ? 'text-primary' : 'text-muted opacity-50'}>{f.icon}</span>
                      {f.name}
                      {format === f.id && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-muted uppercase tracking-tighter leading-none mb-1">Status</span>
              <span className={`text-[12px] font-black ${response.status >= 200 && response.status < 300 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {response.status} {getStatusLabel(response.status)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-muted uppercase tracking-tighter leading-none mb-1">Time</span>
              <span className="text-[12px] font-black text-foreground/80">{response.duration_ms} ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-muted uppercase tracking-tighter leading-none mb-1">Size</span>
              <span className="text-[12px] font-black text-foreground/80">
                {response.body.length < 1024
                  ? `${response.body.length} B`
                  : `${(response.body.length / 1024).toFixed(2)} KB`}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-4 bg-muted/20" />

          <button className="flex items-center gap-2 group">
            <span className="text-[11px] font-black text-muted group-hover:text-primary uppercase tracking-widest transition-colors">Save Response</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary transition-colors"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-hidden relative group/content">
        {activeTab === 'pretty' && (
          <div className="h-full overflow-y-auto p-4 font-mono text-[11px] leading-relaxed selection:bg-primary/20">
            <div className="liquid-glass p-8 rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto min-h-full bg-black/10 dark:bg-white/2">
              <pre className={`transition-all duration-300 ${format === 'json' ? 'text-amber-600 dark:text-amber-200/90' :
                  format === 'javascript' ? 'text-blue-600 dark:text-blue-200/90' :
                    'text-emerald-600 dark:text-emerald-200/90'
                } whitespace-pre-wrap`}>
                {formattedBody}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground mb-2">Neural Visualizer Offline</h4>
            <p className="text-[10px] text-muted font-bold tracking-wide max-w-xs leading-relaxed">
              This response data requires a specific schema for 3D topological visualization. Switch to Body for raw telemetry.
            </p>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover/content:opacity-100 transition-opacity duration-300">
          <button className="p-2.5 rounded-xl glass-panel border border-white/10 text-muted hover:text-primary hover:border-primary/50 transition-all shadow-xl" title="Copy to Clipboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button className="p-2.5 rounded-xl glass-panel border border-white/10 text-muted hover:text-primary hover:border-primary/50 transition-all shadow-xl" title="Search in Response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
