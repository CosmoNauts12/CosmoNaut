"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import WorkspaceHeader from "../components/WorkspaceHeader";

export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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
        <WorkspaceSidebar />

        {/* Main Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-card-bg/20 backdrop-blur-sm">
          {/* Tabs Bar */}
          <div className="h-10 border-b border-card-border flex items-center px-2 gap-1 overflow-x-auto scrollbar-hide bg-black/5 dark:bg-white/5">
            <div className="px-4 h-full flex items-center gap-2 border-r border-card-border bg-foreground/5 text-xs text-foreground font-medium min-w-[120px] max-w-[200px] group cursor-pointer relative">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="truncate">My first request</span>
              <button className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-foreground/10 rounded p-0.5 transition-all">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            </div>
            
            <button className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          {/* Activity Content (Overview Stub) */}
          <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-primary/10">
                  {user.displayName?.charAt(0).toUpperCase() || "W"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.displayName || "User"}'s Workspace</h1>
                  <p className="text-muted text-sm font-medium">Last active just now</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="liquid-glass p-8 rounded-[2rem] border-card-border hover:border-primary/30 transition-all group">
                  <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                    <span className="text-primary italic">⚡</span> Getting Started
                  </h3>
                  <p className="text-sm text-muted leading-relaxed mb-6">
                    Connect your APIs and start building. Create your first collection to organize your requests.
                  </p>
                  <button className="glass-btn-primary px-6 py-2 rounded-xl text-xs">
                    Create a Collection
                  </button>
                </div>
                
                <div className="liquid-glass p-8 rounded-[2rem] border-card-border hover:border-primary/30 transition-all">
                  <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                    <span className="text-secondary italic">⟲</span> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 border border-card-border/30">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold">GET</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">https://api.cosmonaut.io/v1/user</p>
                        <p className="text-[10px] text-muted">200 OK • 124ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contributors Section */}
              <div className="mb-12">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 border-b border-card-border pb-2">Contributors</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-primary/20">
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">You</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="h-7 border-t border-card-border bg-card-bg/50 backdrop-blur-md flex items-center justify-between px-3 text-[10px] text-muted font-medium z-40 transition-colors duration-500">
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
    </div>
  );
}
