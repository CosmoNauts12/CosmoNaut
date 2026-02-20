"use client";


import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useSettings } from "./SettingsProvider";
import { useAuth } from "./AuthProvider";

/**
 * WorkspaceHeader Component
 * 
 * Top navigation bar for the workspace view.
 * Features:
 * - Breadcrumbs for navigation context.
 * - Global actions (Overview, Settings).
 * - User profile dropdown and theme toggle.
 */
export default function WorkspaceHeader() {
  const { settings, updateSettings, setSettingsOpen, openSettings } = useSettings();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-card-border bg-card-bg/20 backdrop-blur-md sticky top-0 z-40 transition-colors duration-500">
      <div className="flex items-center gap-6">
        {/* Breadcrumbs/Nav */}
        <div id="tour-header-breadcrumbs" className="flex items-center gap-2 text-[13px]">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Home
          </Link>
          <span className="text-card-border">/</span>
          <span className="text-foreground font-semibold">My Workspace</span>
          <div className="ml-2 px-1.5 py-0.5 rounded bg-foreground/5 border border-card-border text-[11px] text-muted font-bold uppercase tracking-wider">Public</div>
        </div>

        {/* Global Nav Links */}
        <nav className="hidden md:flex items-center gap-4 text-[13px] font-medium border-l border-card-border pl-6">
          <button className="text-primary bg-primary/10 px-2.5 py-1 rounded-md">Overview</button>
          <button className="text-muted hover:text-foreground px-2.5 py-1 transition-colors">Updates</button>
          <button
            onClick={() => openSettings("general")}
            className="text-muted hover:text-foreground px-2.5 py-1 transition-colors"
          >
            Settings
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* User Dropdown */}
        <div className="relative flex items-center h-full">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-2 ring-primary/20 hover:scale-110 transition-transform active:scale-95"
          >
            {user?.displayName?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Invisible Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-12 w-64 liquid-glass rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right duration-200 z-50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50" />
                <div className="relative z-10 p-5">
                  <div className="mb-4">
                    <p className="text-[11px] text-muted/80 font-black uppercase tracking-widest">Signed in as</p>
                    <p className="font-bold text-[15px] text-foreground truncate">{user?.displayName || "Explorer"}</p>

                    {/* Status Display/Edit */}
                    <div className="mt-2">
                      {isEditingStatus ? (
                        <input
                          autoFocus
                          type="text"
                          value={settings.status || ""}
                          onChange={(e) => updateSettings({ status: e.target.value })}
                          onBlur={() => setIsEditingStatus(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatus(false)}
                          placeholder="Set status..."
                          className="w-full bg-black/20 border border-primary/30 rounded-lg px-2 py-1 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      ) : (
                        <div
                          onClick={() => setIsEditingStatus(true)}
                          className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-card-border bg-white/5 text-[11px] cursor-pointer transition-all hover:bg-white/10 group ${settings.status ? 'text-foreground' : 'text-muted hover:text-primary hover:border-primary/50'
                            }`}
                        >
                          <span className="group-hover:scale-110 transition-transform">{settings.status ? '🟢' : '✨'}</span>
                          <span className="truncate">{settings.status || "Set status"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-card-border/50 my-2" />

                  <div className="space-y-1">
                    <button
                      onClick={() => openSettings("profile")}
                      className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all">
                      Resource Center
                    </button>
                  </div>

                  <div className="h-px bg-card-border/50 my-2" />

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all group"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button id="tour-invite-btn" className="px-3 py-1 bg-primary text-white text-[13px] font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          Invite
        </button>

        <div className="h-4 w-px bg-card-border mx-1" />

        <ThemeToggle />
      </div>
    </header>
  );
}
