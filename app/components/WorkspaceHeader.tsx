"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function WorkspaceHeader() {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-card-border bg-card-bg/20 backdrop-blur-md sticky top-0 z-40 transition-colors duration-500">
      <div className="flex items-center gap-6">
        {/* Breadcrumbs/Nav */}
        <div id="tour-header-breadcrumbs" className="flex items-center gap-2 text-xs">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Home
          </Link>
          <span className="text-card-border">/</span>
          <span className="text-foreground font-semibold">My Workspace</span>
          <div className="ml-2 px-1.5 py-0.5 rounded bg-foreground/5 border border-card-border text-[10px] text-muted font-bold uppercase tracking-wider">Public</div>
        </div>

        {/* Global Nav Links */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium border-l border-card-border pl-6">
          <button className="text-primary bg-primary/10 px-2.5 py-1 rounded-md">Overview</button>
          <button className="text-muted hover:text-foreground px-2.5 py-1 transition-colors">Updates</button>
          <button className="text-muted hover:text-foreground px-2.5 py-1 transition-colors">Settings</button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Team/Invite */}
        <div className="flex items-center -space-x-2 mr-2">
          <div className="w-6 h-6 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-primary/20">A</div>
        </div>
        
        <button id="tour-invite-btn" className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          Invite
        </button>

        <div className="h-4 w-px bg-card-border mx-1" />

        <ThemeToggle />
      </div>
    </header>
  );
}
