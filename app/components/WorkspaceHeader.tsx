"use client";


import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import ThemeToggle from "./ThemeToggle";
import { useSettings } from "./SettingsProvider";
import { useAuth } from "./AuthProvider";
import { useCollections } from "./CollectionsProvider";
import InviteModal from "./InviteModal";
import UpdatesModal from "./UpdatesModal";

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
  const { user, logout, isDemo } = useAuth();
  const { workspaces, activeWorkspaceId } = useCollections();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);

  const handleRoleChange = async (collabId: string, newRole: string) => {
    try {
      if (activeWorkspace?.ownerId !== user?.uid) return;
      await updateDoc(doc(db, "collaborators", collabId), {
        role: newRole
      });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    try {
      if (activeWorkspace?.ownerId !== user?.uid) return;
      if (confirm("Are you sure you want to remove this collaborator?")) {
        await deleteDoc(doc(db, "collaborators", collabId));
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
    }
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  // Listen for real-time updates to pending invitations
  useEffect(() => {
    if (!user?.email || isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingCount(0);
      return;
    }

    const q = query(
      collection(db, "invitations"),
      where("toEmail", "==", user.email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    }, (error) => {
      console.error("Error listening to pending invites in header:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for real-time updates to active collaborators in this workspace
  useEffect(() => {
    if (!activeWorkspaceId || activeWorkspaceId === "default") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollaborators([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOwnerInfo(null);
      return;
    }

    if (isDemo) {
      setCollaborators([]);
      setOwnerInfo({
        displayName: user?.displayName || "Demo Explorer",
        initial: (user?.displayName || "D").charAt(0).toUpperCase()
      });
      return;
    }

    // Fetch the workspace owner info once when workspace changes
    if (activeWorkspace?.ownerId) {
      getDoc(doc(db, "users", activeWorkspace.ownerId)).then(userDocSnap => {
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setOwnerInfo({
            displayName: userData.displayName || userData.email || "Unknown",
            initial: (userData.displayName || userData.email || "O").charAt(0).toUpperCase()
          });
        }
      });
    }

    const q = query(
      collection(db, "collaborators"),
      where("projectId", "==", activeWorkspaceId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const collabPromises = snapshot.docs.map(async (collabDoc) => {
          const collabData = collabDoc.data();
          // Fetch user details to get avatar/name
          const userDocSnap = await getDoc(doc(db, "users", collabData.userId));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            return {
              id: collabDoc.id,
              userId: collabData.userId,
              role: collabData.role,
              displayName: userData.displayName || userData.email || "Unknown",
              email: userData.email,
              initial: (userData.displayName || userData.email || "U").charAt(0).toUpperCase()
            };
          }
          return null;
        });

        const resolvedCollabs = (await Promise.all(collabPromises)).filter(Boolean) as any[];

        // Deduplicate by userId in case of old test data
        const uniqueCollabs = Array.from(new Map(resolvedCollabs.map(item => [item.userId, item])).values());
        setCollaborators(uniqueCollabs);
      } catch (error) {
        console.error("Error fetching collaborator details:", error);
      }
    });

    return () => unsubscribe();
  }, [activeWorkspaceId, activeWorkspace?.ownerId]);

  return (
    <header className="h-16 shrink-0 border-b border-card-border/50 bg-black/10 dark:bg-white/2 backdrop-blur-3xl z-40 relative group/header transition-all duration-500 hover:bg-black/20 dark:hover:bg-white/5">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none opacity-50" />
      <div className="flex h-full items-center justify-between px-6 relative z-10 w-full">
        {/* Left Side: Logo & Workspace Info */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 group/logo cursor-pointer" onClick={() => (window as any).location.reload()}>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-xl blur-lg opacity-0 group-hover/logo:opacity-40 transition-opacity duration-500" />
              <div className="relative w-9 h-9 liquid-glass rounded-xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden active:scale-95 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-20" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:scale-110 transition-transform"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-[-0.04em] text-foreground leading-none">COSMONAUT</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mt-0.5 opacity-60">Deep Space Protocol</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center h-8 px-2 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/5 gap-4 shadow-inner">
            <button className="px-4 h-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/5 rounded-xl transition-all">Workspaces</button>
            <div className="w-px h-3 bg-muted/20" />
            <button className="px-4 h-full text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all">Collections</button>
          </div>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Global Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-black uppercase tracking-widest mr-4">
            <button className="text-primary hover:opacity-80 transition-opacity">Overview</button>
            <button
              onClick={() => openSettings("general")}
              className="text-muted hover:text-foreground transition-all"
            >
              Settings
            </button>
          </nav>

          <div className="h-4 w-px bg-white/10 mx-2" />

          {/* Collaborators Facepile */}
          {(collaborators.length > 0 || (activeWorkspace?.ownerId === user?.uid)) && (
            <div className="relative flex items-center group/facepile cursor-help">
              <div className="flex items-center relative transition-opacity">
                {/* Show Actual Workspace Owner */}
                {ownerInfo && (
                  <div
                    className="w-8 h-8 rounded-full bg-slate-200 border-2 border-background flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm relative z-10"
                    title={`${ownerInfo.displayName} (Owner)`}
                  >
                    {ownerInfo.initial}
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-background flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                  </div>
                )}

                {/* Render other collaborators */}
                {collaborators.filter(c => c.userId !== activeWorkspace?.ownerId).slice(0, 4).map((collab, index) => (
                  <div
                    key={collab.id}
                    className={`w-8 h-8 rounded-full bg-primary/10 text-primary border-2 border-background flex items-center justify-center text-xs font-bold shadow-sm relative -ml-2`}
                    style={{ zIndex: 10 - index - 1 }}
                    title={`${collab.displayName} (${collab.role})`}
                  >
                    {collab.initial}
                  </div>
                ))}

                {collaborators.filter(c => c.userId !== activeWorkspace?.ownerId).length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-sm -ml-2 z-0">
                    +{collaborators.filter(c => c.userId !== activeWorkspace?.ownerId).length - 4}
                  </div>
                )}
              </div>

              {/* Collaborators Hover Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-background rounded-2xl border border-card-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 flex flex-col max-h-[400px] opacity-0 invisible group-hover/facepile:opacity-100 group-hover/facepile:visible transition-all duration-200 translate-y-2 group-hover/facepile:translate-y-0 origin-top-right pointer-events-none group-hover/facepile:pointer-events-auto overflow-hidden">
                <div className="relative z-10 p-4 overflow-y-auto">
                  <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-60 mb-3">Workspace Access</p>
                  <div className="flex flex-col gap-3">
                    {ownerInfo && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 border border-background flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm relative">
                          {ownerInfo.initial}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground truncate">{ownerInfo.displayName}</span>
                          <span className="text-[10px] text-muted">Owner</span>
                        </div>
                      </div>
                    )}
                    {collaborators.filter(c => c.userId !== activeWorkspace?.ownerId).map((collab) => (
                      <div key={collab.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 text-primary flex items-center justify-center text-xs font-bold">
                          {collab.initial}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-foreground truncate">{collab.displayName}</span>
                          <span className="text-[10px] text-muted truncate">{collab.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button id="tour-invite-btn" onClick={() => setIsInviteOpen(true)} className="px-4 py-2 bg-gradient-to-br from-primary to-secondary text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border border-white/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Invite
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <ThemeToggle />

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* User Dropdown */}
          <div className="relative flex items-center h-full">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-black text-white shadow-xl ring-4 ring-primary/10 hover:scale-105 transition-all active:scale-95"
            >
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-14 w-72 rounded-[2rem] border border-white/20 bg-gradient-to-br from-[#0a1f2e] to-[#0a2e24] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right duration-300 z-50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 opacity-40 pointer-events-none" />

                  <div className="relative z-10 p-6">
                    {/* User Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-black text-white shadow-lg ring-4 ring-white/5">
                        {user?.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-base text-foreground truncate tracking-tight">{user?.displayName || "Explorer"}</p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Professional Plan</p>
                      </div>
                    </div>

                    {/* Status Box */}
                    <div className="mb-6">
                      {isEditingStatus ? (
                        <div className="relative">
                          <input
                            autoFocus
                            type="text"
                            value={settings.status || ""}
                            onChange={(e) => updateSettings({ status: e.target.value })}
                            onBlur={() => setIsEditingStatus(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatus(false)}
                            placeholder="What's happening?"
                            className="w-full bg-white/5 border border-primary/40 rounded-2xl px-4 py-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/50"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary animate-pulse">EDITING</div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsEditingStatus(true)}
                          className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden relative active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-lg group-hover:scale-125 transition-transform duration-300">{settings.status ? '🟢' : '✨'}</span>
                          <span className={`text-xs font-medium truncate ${settings.status ? 'text-foreground' : 'text-muted'}`}>
                            {settings.status || "Set your status..."}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-white/5 mb-4" />

                    {/* Menu Options */}
                    <div className="space-y-2">
                      <button
                        onClick={() => openSettings("profile")}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all group"
                      >
                        <span>Profile Settings</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all group">
                        <span>Resource Center</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>

                    <div className="h-px bg-white/5 my-4" />

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-all group active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                      </div>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <UpdatesModal isOpen={isUpdatesOpen} onClose={() => setIsUpdatesOpen(false)} />
    </header>
  );
}
