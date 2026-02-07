"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import WorkspaceHeader from "../components/WorkspaceHeader";
import DemoTour from "../components/DemoTour";

import RequestPanel, { ActiveRequest } from "../components/RequestPanel";
import ResponsePanel from "../components/ResponsePanel";
import { useSettings } from "../components/SettingsProvider";
import { CosmoResponse } from "../components/RequestEngine";
import { SavedRequest } from "../lib/collections";

export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("request");
  const [activeRequest, setActiveRequest] = useState<ActiveRequest>({ 
    id: 'r1', 
    name: 'Get All Users', 
    method: 'GET' 
  });
  const [lastResponse, setLastResponse] = useState<CosmoResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user && settings.lastWorkspaceId !== "default") {
      // Save this as the last active workspace
      updateSettings({ lastWorkspaceId: "default" }); 
    }
  }, [user, loading, router, updateSettings, settings.lastWorkspaceId]);

  const handleSelectRequest = (request: SavedRequest & { collectionId: string }) => {
    setActiveRequest(request);
    setActiveTab("request");
  };

  const handleCloseTab = (id: string) => {
    if (settings.confirmCloseTab) {
      if (!window.confirm("Are you sure you want to close this tab? Any unsaved changes may be lost.")) {
        return;
      }
    }
    setActiveTab("overview");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden selection:bg-primary/30 transition-colors duration-500">
      {/* Background Subtle Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-500">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <WorkspaceHeader />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <WorkspaceSidebar onSelectRequest={handleSelectRequest} />

        {/* Main Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-card-bg/20 backdrop-blur-sm">
          {/* Tabs Bar */}
          <div id="tour-tabs-bar" className="h-10 border-b border-card-border flex items-center px-2 gap-1 overflow-x-auto scrollbar-hide bg-black/5 dark:bg-white/5">
            <div 
              onClick={() => setActiveTab("overview")}
              className={`px-4 h-full flex items-center gap-2 border-r border-card-border text-[10px] font-black uppercase tracking-widest cursor-pointer relative transition-all ${
                activeTab === 'overview' ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              Overview
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </div>

            <div 
              onClick={() => setActiveTab("request")}
              className={`px-4 h-full flex items-center gap-2 border-r border-card-border text-[10px] font-black uppercase tracking-widest cursor-pointer relative min-w-[140px] transition-all group ${
                activeTab === 'request' ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeRequest.method === 'GET' ? 'bg-emerald-500' :
                activeRequest.method === 'POST' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />
              <span className="truncate">{activeRequest.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleCloseTab(activeRequest.id); }}
                className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-foreground/10 rounded p-0.5 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              {activeTab === 'request' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </div>
            
            <button className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div id="tour-main-content" className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "overview" ? (
              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-8 text-center md:text-left">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-primary/30 ring-4 ring-primary/10 mx-auto md:mx-0">
                      {user.displayName?.charAt(0).toUpperCase() || "W"}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-[0.1em]">{user.displayName || "User"}'s Space</h1>
                      <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50">Commander Access • Last active just now</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="liquid-glass p-8 rounded-[2.5rem] border-card-border/50 hover:border-primary/40 transition-all group cursor-pointer">
                      <h3 className="text-xs font-black mb-4 text-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="text-primary italic">⚡</span> New Mission
                      </h3>
                      <p className="text-[10px] text-muted font-bold leading-relaxed mb-6">
                        Establish new API protocols. Group related requests and set global variables for your crew.
                      </p>
                      <button className="glass-btn-primary px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Protocol Setup
                      </button>
                    </div>
                    
                    <div className="liquid-glass p-8 rounded-[2.5rem] border-card-border/50 hover:border-primary/40 transition-all">
                      <h3 className="text-xs font-black mb-4 text-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="text-secondary italic">⟲</span> Log History
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 border border-card-border/30">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-black">GET</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black truncate text-foreground/80">API.COSMONAUT.IO/V1/USER</p>
                            <p className="text-[9px] text-muted font-bold">200 OK • 124MS</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <RequestPanel 
                    activeRequest={activeRequest}
                    onResponse={setLastResponse} 
                    onExecuting={setIsExecuting} 
                  />
                </div>
                <div className="h-[40%] min-h-[200px]">
                  <ResponsePanel response={lastResponse} isExecuting={isExecuting} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <footer id="tour-footer-actions" className="h-7 border-t border-card-border bg-card-bg/50 backdrop-blur-md flex items-center justify-between px-3 text-[10px] text-muted font-medium z-40 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <button className="hover:text-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Cloud View</button>
          <button className="hover:text-foreground">Find and replace</button>
          <button className="hover:text-foreground">Console</button>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-tighter">
          <button className="hover:text-foreground">Runner</button>
          <button className="hover:text-foreground">Trash</button>
        </div>
      </footer>

      <DemoTour />
    </div>
  );
}
