"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import ThemeToggle from "../components/ThemeToggle";
import { useSettings } from "../components/SettingsProvider";
import { useCollections } from "../components/CollectionsProvider";
import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(() => import("../components/AnalyticsDashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center p-12 text-center bg-card-bg/5 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing Mission Data...</p>
      </div>
    </div>
  )
});
import InviteModal from "../components/InviteModal";

/**
 * Dashboard Page
 * 
 * The main interface for authenticated users.
 * Features:
 * - Sidebar navigation with user profile and quick links.
 * - Welcome banner with dynamic greeting.
 * - Quick access to project creation and team management.
 * - Responsive design with collapsible sidebar on mobile (TODO).
 */
export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const { settings, setSettingsOpen, updateSettings, openSettings } = useSettings();
  const { createWorkspace, createFlow } = useCollections();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  /**
   * Handles user logout.
   * Clears auth state and redirects to the landing page.
   */
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  /**
   * Creates a new project workspace.
   * Calls the collection provider to create a new workspace and redirects to it.
   */
  const handleNewProject = async () => {
    try {
      await createWorkspace("New Project");
      router.push("/workspace");
    } catch (error) {
      console.error("Dashboard: Failed to create new project", error);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans transition-colors duration-500">
      {/* Background Splash - Teal Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle top-right blue splash */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        {/* Bottom-left teal splash */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 hidden md:flex flex-col border-r border-card-border bg-card-bg/50 backdrop-blur-md z-20 overflow-hidden">
        <div className="p-6">
          {/* User Profile in Sidebar - Dropdown */}
          <div className="relative mb-6">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" title={user.displayName || "User"}>
                  {user.displayName || "User"}
                </h3>
                <p className="text-xs text-muted truncate" title={user.email || ""}>
                  {user.email?.split('@')[0]}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#14283C] border border-gray-100 dark:border-none rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-lg dark:shadow-none">
                {/* Header */}
                <div className="p-4">
                  <p className="text-xs text-muted">Signed in as</p>
                  <p className="font-semibold text-sm text-foreground truncate">{user.displayName || "User"}</p>

                  {/* Status Editor */}
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
                        className="w-full bg-black/5 dark:bg-black/20 border border-gray-200 dark:border-primary/30 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    ) : (
                      <div
                        onClick={() => setIsEditingStatus(true)}
                        className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/10 group ${settings.status ? 'text-foreground' : 'text-muted hover:text-primary hover:border-primary/50'
                          }`}
                      >
                        <span className="group-hover:scale-110 transition-transform">{settings.status ? '🟢' : '☺'}</span>
                        <span className="truncate">{settings.status || "Set status"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 1 */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openSettings("profile");
                    }}
                    className="w-full text-left px-4 py-1.5 text-sm text-muted hover:bg-gray-50 dark:hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Your Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openSettings("billing");
                    }}
                    className="w-full text-left px-4 py-1.5 text-sm text-muted hover:bg-gray-50 dark:hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openSettings("general");
                    }}
                    className="w-full text-left px-4 py-1.5 text-sm text-muted hover:bg-gray-50 dark:hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openSettings("shortcuts");
                    }}
                    className="w-full text-left px-4 py-1.5 text-sm text-muted hover:bg-gray-50 dark:hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Keyboard shortcuts
                  </button>
                </div>

                {/* Sign Out */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-1.5 text-sm text-muted hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation - No Icons, Text Only */}
          {[
            { id: 'home', label: 'Home', path: '/dashboard' },
            { id: 'workspace', label: 'Workspace', path: '/workspace' },
            { id: 'reports', label: 'Reports', path: '#' },
            { id: 'settings', label: 'Settings', path: '#' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings') {
                  openSettings("general");
                } else if (item.path !== '#') {
                  router.push(item.path);
                }
                setActiveTab(item.id);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id
                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
              {item.label}
            </button>
          ))}

          {/* Invite CTA - Clean */}
          <div className="mt-10 px-2">
            <button onClick={() => setIsInviteOpen(true)} className="w-full py-2 px-3 bg-white dark:bg-[#14283C] border border-gray-200 dark:border-none text-foreground text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
              + Invite Member
            </button>
          </div>

          {/* CosmoNaut Resources */}
          <div className="mt-8 px-2 space-y-2">
            {[
              { label: 'What is CosmoNaut', href: 'https://cosmonaut-website.vercel.app/' },
              { label: 'How to Publish', href: 'https://cosmonaut-website.vercel.app/' },
              { label: 'Learning Center', href: 'https://cosmonaut-website.vercel.app/' },
              { label: 'Support Center', href: 'https://cosmonaut-website.vercel.app/' },
              { label: 'CosmoNaut Enterprise', href: 'https://cosmonaut-website.vercel.app/' }
            ].map((link, i) => (
              <button
                key={i}
                onClick={async () => {
                  try {
                    const { open } = await import('@tauri-apps/plugin-shell');
                    await open(link.href);
                  } catch (e) {
                    console.error("Failed to open link:", e);
                    window.open(link.href, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="flex items-center justify-between w-full text-xs font-medium text-muted hover:text-foreground transition-colors group text-left"
              >
                <span>{link.label}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-6 border-t border-card-border">
          <button onClick={handleLogout} className="text-xs font-medium text-muted hover:text-foreground transition-colors px-4">
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen relative z-10 overflow-y-auto">

        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-8 border-b border-card-border bg-card-bg/30 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Search Bar - Minimal */}
            <div className="relative group max-w-sm hidden sm:block">
              <input
                type="text"
                placeholder="Search..."
                className="px-4 py-1.5 bg-transparent border-b border-input-border text-sm w-64 focus:w-72 transition-all focus:outline-none focus:border-primary placeholder-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">

          {activeTab === 'home' ? (
            <div className="max-w-4xl mx-auto">
              {/* Minimal Welcome Banner - Matching Login Theme (Glass) */}
              <div className="w-full relative rounded-2xl overflow-hidden min-h-[350px] flex items-center liquid-glass shadow-xl mb-12 border border-card-border group">

                {/* Subtle animated gradient background opacity for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>

                <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between p-10 gap-8">

                  <div className="text-foreground max-w-lg text-center md:text-left">
                    <div className="flex flex-row items-baseline justify-center md:justify-start gap-4 mb-6 flex-wrap">
                      <span className="font-cursive text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 drop-shadow-sm leading-none py-1">
                        Hello,
                      </span>
                      <span className="font-sans font-light tracking-wide text-4xl md:text-5xl text-foreground pb-1">
                        {user.displayName || "Explorer"}
                      </span>
                    </div>

                    <p className="text-base text-muted mb-8 max-w-md font-normal leading-relaxed">
                      Let&apos;s streamline your workflow. Whether you&apos;re building new APIs, debugging calls, or running automated tests, everything you need is right here. Ready to create your first request?
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <button
                        onClick={handleNewProject}
                        className="glass-btn-primary px-6 py-2.5 rounded-xl text-sm shadow-lg"
                      >
                        Create Project
                      </button>
                      <button className="px-6 py-2.5 bg-card-bg border border-input-border text-foreground hover:bg-card-border transition-colors text-sm font-medium rounded-xl">
                        Documentation
                      </button>
                    </div>
                  </div>

                  <div className="relative w-96 h-96 hidden md:block opacity-100 transform group-hover:scale-105 transition-transform duration-700 ease-in-out -mr-10">
                    <img
                      src="/robot.png"
                      alt="Astronaut"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions - Clean Cards */}
              <h2 className="text-lg font-bold mb-6 text-foreground">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: 'New Project', desc: 'Start a new initiative', action: handleNewProject },
                  { title: 'Team', desc: 'Manage members', action: () => { } },
                  { title: 'Analytics', desc: 'View performance', action: () => { setActiveTab('reports'); } }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    className="group p-5 rounded-xl border border-card-border hover:border-primary/50 bg-card-bg hover:bg-card-bg/80 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-xs text-muted">{item.desc}</p>
                    <div className="mt-4 h-0.5 w-8 bg-card-border group-hover:w-full group-hover:bg-primary/20 transition-all duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            <AnalyticsDashboard />
          ) : null}


        </div>
      </main>

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}
