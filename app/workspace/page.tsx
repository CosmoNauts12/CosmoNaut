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
import PromptModal from "../components/PromptModal";
import FlowBuilder from "../components/Flows/FlowBuilder";
import FlowsLanding from "../components/Flows/FlowsLanding";
import FlowLoadingOverlay from "../components/Flows/FlowLoadingOverlay";

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

  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [flowNamingPrompt, setFlowNamingPrompt] = useState<{ isOpen: boolean; onSubmit: (name: string) => void }>({ isOpen: false, onSubmit: () => { } });

  const { createFlow } = useCollections();

  const handleCreateFlowInWorkspace = async () => {
    setIsCreatingFlow(true);
    try {
      // Step 1: Decorative Loading (Image 2)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsCreatingFlow(false);

      // Step 2: Show Naming Modal (Image 3)
      setFlowNamingPrompt({
        isOpen: true,
        onSubmit: async (name) => {
          const flowId = await createFlow(name);
          // Small delay to ensure state sync before opening
          setTimeout(() => {
            const flow = flows.find(f => f.id === flowId);
            if (flow) {
              handleSelectFlow(flow);
            }
          }, 100);
        }
      });
    } catch (error) {
      console.error("Workspace: Failed to initiate flow creation", error);
      setIsCreatingFlow(false);
    }
  };

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
    const nextTabs = tabs.reduce<ActiveTab[]>((acc, t) => {
      if (t.tabType === 'flow') {
        const flow = flows.find(f => f.id === t.id);
        if (!flow) {
          return acc;
        }
        if (flow.name !== t.name) {
          acc.push({ ...flow, tabType: 'flow' });
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
        return acc;
      }

      if (request.name !== t.name || request.method !== t.method) {
        acc.push({ ...t, name: request.name, method: request.method });
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          onActivityChange={setActiveActivity}
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
              activeActivity === 'flows' ? (
                <div className="flex-1 overflow-y-auto">
                  {flows.length === 0 ? (
                    <FlowsLanding onCreateFlow={handleCreateFlowInWorkspace} />
                  ) : (
                    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase tracking-[0.1em]">Flows Dashboard</h1>
                          <p className="text-muted text-[11px] font-black uppercase tracking-widest opacity-70 mt-1">Command Center • {flows.length} Active {flows.length === 1 ? 'Protocol' : 'Protocols'}</p>
                        </div>
                        <button
                          onClick={handleCreateFlowInWorkspace}
                          className="px-5 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          New Flow
                        </button>
                      </div>

                      {/* Statistics Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="liquid-glass p-5 rounded-2xl border-card-border/50">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1 items-center flex gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Total Flows</p>
                          <p className="text-2xl font-black text-foreground">{flows.length}</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-2xl border-card-border/50">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1 items-center flex gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Active</p>
                          <p className="text-2xl font-black text-foreground">{flows.length}</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-2xl border-card-border/50">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1 items-center flex gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/> Failed Runs</p>
                          <p className="text-2xl font-black text-foreground">0</p>
                        </div>
                        <div className="liquid-glass p-5 rounded-2xl border-card-border/50">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1 items-center flex gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Last Run</p>
                          <p className="text-xl font-black text-foreground mt-1">Just now</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Flows Grid */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-card-border/50">
                            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Recent Protocols</h2>
                            <button className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-widest font-bold">View All</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Create New Flow Card within Grid */}
                            <div
                              onClick={handleCreateFlowInWorkspace}
                              className="liquid-glass p-6 rounded-[1.25rem] border-card-border/50 hover:border-primary/40 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer group min-h-[160px] bg-background/50 hover:bg-card-bg/50 transition-all shadow-sm"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                              </div>
                              <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Create Flow</h3>
                              <p className="text-[10px] text-muted font-bold">Start a new blank protocol</p>
                            </div>

                            {/* Existing Flows */}
                            {flows.map(flow => (
                              <div
                                key={flow.id}
                                className="liquid-glass p-5 rounded-[1.25rem] border-card-border/50 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(var(--primary-rgb),0.12)] transition-all group flex flex-col min-h-[160px]"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                  </div>
                                  <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    Active
                                  </div>
                                </div>
                                
                                <div className="flex-1 cursor-pointer" onClick={() => handleSelectFlow(flow)}>
                                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider group-hover:text-primary transition-colors line-clamp-1">{flow.name}</h3>
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">{flow.blocks.length} {flow.blocks.length === 1 ? 'Step' : 'Steps'} • Edited recently</p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-card-border/30 flex items-center gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleSelectFlow(flow); }} className="flex-1 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Open
                                  </button>
                                  <button className="w-7 h-7 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground flex items-center justify-center transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sidebar: Templates & Activity */}
                        <div className="space-y-6">
                          {/* Templates */}
                          <div className="liquid-glass p-5 rounded-2xl border-card-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-secondary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Templates</h3>
                            </div>
                            <div className="space-y-2">
                              {['API Chaining', 'Data Aggregation', 'Scheduled Sync'].map((tmpl) => (
                                <div key={tmpl} className="p-3 rounded-xl bg-background/50 border border-card-border/30 hover:border-secondary/40 hover:bg-secondary/5 cursor-pointer transition-all group flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground/80 group-hover:text-secondary transition-colors">{tmpl}</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-secondary transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Activity */}
                          <div className="liquid-glass p-5 rounded-2xl border-card-border/50 flex-1">
                            <div className="flex items-center gap-2 mb-4">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Activity</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <div>
                                  <p className="text-[10px] font-bold text-foreground line-clamp-1">Flow &quot;{flows[0]?.name || 'New Flow'}&quot; created</p>
                                  <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-0.5">Just now</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                                <div>
                                  <p className="text-[10px] font-bold text-foreground line-clamp-1">Workspace protocol initialized</p>
                                  <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-0.5">2 hours ago</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8 text-center md:text-left">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-primary/30 ring-4 ring-primary/10 mx-auto md:mx-0">
                        {user.displayName?.charAt(0).toUpperCase() || "W"}
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-[0.1em]">{user.displayName || "User"}&apos;s Space</h1>
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
              )

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

      <PromptModal
        isOpen={flowNamingPrompt.isOpen}
        onClose={() => setFlowNamingPrompt({ ...flowNamingPrompt, isOpen: false })}
        onSubmit={flowNamingPrompt.onSubmit}
        title="NEW FLOW"
        placeholder="Flow Name"
      />

      {isCreatingFlow && <FlowLoadingOverlay />}
    </div>
  );
}
