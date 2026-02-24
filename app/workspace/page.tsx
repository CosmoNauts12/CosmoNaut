"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import WorkspaceHeader from "../components/WorkspaceHeader";
import DemoTour from "../components/DemoTour";

import RequestPanel, { ActiveRequest } from "../components/RequestPanel";
import ResponsePanel from "../components/ResponsePanel";
import { useSettings } from "../components/SettingsProvider";
import { useCollections } from "../components/CollectionsProvider";
import { SavedRequest, Flow } from "../lib/collections";
import ConfirmModal from "../components/ConfirmModal";
import FlowBuilder from "../components/Flows/FlowBuilder";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export type ActiveTab = (ActiveRequest & { tabType: 'request' }) | (Flow & { tabType: 'flow' });

/**
 * The main workspace interface of CosmoNaut.
 * Manages the tabbed request system, sidebar navigation, and dashboard overview.
 */
export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const { activeWorkspaceId, collections, history, flows } = useCollections();
  const router = useRouter();

  // Tab Management State
  /** List of currently open request tabs. */
  const [tabs, setTabs] = useState<ActiveTab[]>([]);
  /** ID of the tab currently being viewed. Defaults to 'overview'. */
  const [activeTabId, setActiveTabId] = useState<string>("overview");

  /** The most recent HTTP response received. */
  const [lastResponse, setLastResponse] = useState<any | null>(null);
  /** Whether an HTTP request is currently in progress. */
  const [isExecuting, setIsExecuting] = useState(false);

  /** Current active activity from sidebar. */
  const [activeActivity, setActiveActivity] = useState("collections");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  /**
   * Switches to an existing tab or opens a new one for the selected request.
   * @param request - The request object to open, containing its parent collection ID.
   */
  const handleSelectRequest = (request: SavedRequest & { collectionId: string }) => {
    // Check if tab already exists
    const exists = tabs.find(t => t.id === request.id);
    if (!exists) {
      setTabs(prev => [...prev, { ...request, tabType: 'request' }]);
    }
    setActiveTabId(request.id);
  };

  /**
   * Switches to an existing flow tab or opens a new one.
   */
  const handleSelectFlow = (flow: Flow) => {
    const exists = tabs.find(t => t.id === flow.id);
    if (!exists) {
      setTabs(prev => [...prev, { ...flow, tabType: 'flow' }]);
    }
    setActiveTabId(flow.id);
  };

  /**
   * Closes a specific tab and manages focus transition.
   * Prompts for confirmation if the relevant setting is enabled.
   * @param tabId - Unique identifier of the tab to close.
   */
  /**
   * Executes the actual tab closing logic.
   */
  const performCloseTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // Handle focus switching if we just closed the active tab
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Switch to the previous tab in the list
          const closedIndex = prev.findIndex(t => t.id === tabId);
          const nextIndex = Math.max(0, closedIndex - 1);
          setActiveTabId(newTabs[nextIndex].id);
        } else {
          setActiveTabId("overview");
        }
      }

      return newTabs;
    });
  };

  /**
   * Initiates the tab closing process.
   * Prompts for confirmation if the relevant setting is enabled.
   * @param tabId - Unique identifier of the tab to close.
   */
  const handleCloseTab = (tabId: string) => {
    if (settings.confirmCloseTab) {
      setConfirmModal({
        isOpen: true,
        title: "Close Tab",
        message: "Are you sure you want to close this tab? Any unsaved changes may be lost.",
        onConfirm: () => performCloseTab(tabId)
      });
    } else {
      performCloseTab(tabId);
    }
  };

  const activeRequest = tabs.find(t => t.id === activeTabId);

  /**
   * Synchronization Effect.
   * Keeps open tabs in sync with the global collections state.
   * Handles renames and removes tabs if their source request is deleted.
   */
  // Synchronize tabs with collections during render to avoid cascading renders in useEffect
  const synchronizedTabs = useMemo(() => {
    let changed = false;
    const nextTabs = tabs.reduce<ActiveTab[]>((acc, t) => {
      if (t.tabType === 'flow') {
        const flow = flows.find(f => f.id === t.id);
        if (!flow) {
          changed = true;
          return acc;
        }
        if (flow.name !== t.name) {
          acc.push({ ...flow, tabType: 'flow' });
          changed = true;
        } else {
          acc.push(t);
        }
        return acc;
      }

      if (!('collectionId' in t)) {
        acc.push(t);
        return acc;
      }

      const collection = collections.find(c => c.id === t.collectionId);
      const request = collection?.requests.find(r => r.id === t.id);

      if (!request) {
        changed = true;
        return acc;
      }

      if (request.name !== t.name || request.method !== t.method) {
        acc.push({ ...t, name: request.name, method: request.method });
        changed = true;
      } else {
        acc.push(t);
      }

      return acc;
    }, []);

    // If something changed during derivation, we should probably update the underlying state
    // but doing so during render is tricky. 
    // Actually, if we just use synchronizedTabs for rendering, we don't need to 'save' it back to state
    // unless the user performs an action that needs the updated state.
    return nextTabs;
  }, [tabs, collections]);

  // Update tabs state if they were synchronized (effectively syncing on change)
  useEffect(() => {
    if (JSON.stringify(synchronizedTabs) !== JSON.stringify(tabs)) {
      setTabs(synchronizedTabs);
    }
  }, [synchronizedTabs, tabs]);

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
        <WorkspaceSidebar
          onSelectRequest={handleSelectRequest}
          onSelectFlow={handleSelectFlow}
          onSelectReport={() => setActiveTabId("reports")}
        />

        {/* Main Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-card-bg/20 backdrop-blur-sm">
          {/* Tabs Bar */}
          <div id="tour-tabs-bar" className="h-10 border-b border-card-border flex items-center px-2 gap-1 overflow-x-auto scrollbar-hide bg-black/5 dark:bg-white/5">
            <div
              onClick={() => setActiveTabId("overview")}
              className={`px-4 h-full flex items-center gap-2 border-r border-card-border text-[10px] font-black uppercase tracking-widest cursor-pointer relative transition-all ${activeTabId === 'overview' ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'
                }`}
            >
              Overview
              {activeTabId === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </div>

            <div
              onClick={() => setActiveTabId("reports")}
              className={`px-4 h-full flex items-center gap-2 border-r border-card-border text-[10px] font-black uppercase tracking-widest cursor-pointer relative transition-all ${activeTabId === 'reports' ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'
                }`}
            >
              Reports
              {activeTabId === 'reports' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </div>

            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-4 h-full flex items-center gap-2 border-r border-card-border text-[10px] font-black uppercase tracking-widest cursor-pointer relative min-w-[140px] transition-all group ${activeTabId === tab.id ? 'bg-foreground/5 text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/5'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tab.tabType === 'flow' ? 'bg-primary' :
                  tab.method === 'GET' ? 'bg-emerald-500' :
                    tab.method === 'POST' ? 'bg-amber-500' :
                      'bg-blue-500'
                  }`} />
                <span className="truncate">{tab.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                  className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-foreground/10 rounded p-0.5 transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {activeTabId === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </div>
            ))}

            <button
              onClick={() => {
                const id = `new_${Date.now()}`;
                const newReq: ActiveTab = { id, name: 'New Request', method: 'GET', tabType: 'request' };
                setTabs(prev => [...prev, newReq]);
                setActiveTabId(id);
              }}
              className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors ml-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div id="tour-main-content" className="flex-1 overflow-hidden flex flex-col">
            {activeTabId === "overview" ? (
              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                {/* ... existing overview content ... */}
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
                    <div
                      onClick={() => {
                        const id = `new_${Date.now()}`;
                        const newReq: ActiveTab = { id, name: 'New Request', method: 'GET', tabType: 'request' };
                        setTabs(prev => [...prev, newReq]);
                        setActiveTabId(id);
                      }}
                      className="liquid-glass p-8 rounded-[2.5rem] border-card-border/50 hover:border-primary/40 transition-all group cursor-pointer"
                    >
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

                    <div className="liquid-glass p-8 rounded-[2.5rem] border-card-border/50 hover:border-primary/40 transition-all flex flex-col">
                      <h3 className="text-xs font-black mb-4 text-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="text-secondary italic">⟲</span> Recent Missions
                      </h3>
                      <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-hide max-h-[200px]">
                        {history.length > 0 ? (
                          history.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectRequest({
                                id: item.id,
                                name: item.url.split('/').pop() || item.url,
                                method: item.method,
                                url: item.url,
                                params: item.params,
                                headers: item.headers,
                                auth: item.auth,
                                body: item.body,
                                collectionId: 'history'
                              })}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-foreground/5 border border-card-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm ${item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' :
                                item.method === 'POST' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }`}>
                                {item.method}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black truncate text-foreground/80 uppercase tracking-tight">{item.url.split('://')[1] || item.url}</p>
                                <p className="text-[8px] text-muted font-bold uppercase tracking-widest">
                                  {item.error ? (
                                    <span className="text-rose-500">{item.error.error_type}</span>
                                  ) : (
                                    <span>{item.status} OK • {item.duration_ms}ms</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <p className="text-[9px] font-black uppercase tracking-widest">No missions logged</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTabId === "reports" ? (
              <AnalyticsDashboard />
            ) : !activeRequest ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-muted">Select a tab or activity</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  {activeRequest.tabType === 'flow' ? (
                    <FlowBuilder flow={activeRequest as Flow} />
                  ) : (
                    <RequestPanel
                      activeRequest={activeRequest as any}
                      onResponse={setLastResponse}
                      onExecuting={setIsExecuting}
                    />
                  )}
                </div>
                {activeRequest.tabType !== 'flow' && (
                  <div className="h-[40%] min-h-[200px]">
                    <ResponsePanel response={lastResponse} isExecuting={isExecuting} />
                  </div>
                )}
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
