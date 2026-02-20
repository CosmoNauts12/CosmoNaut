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
  const { user, logout } = useAuth();
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
    if (!user?.email) {
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
      setCollaborators([]);
      setOwnerInfo(null);
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
    <header className="h-12 flex items-center justify-between px-4 border-b border-card-border bg-card-bg/20 backdrop-blur-md sticky top-0 z-40 transition-colors duration-500">
      <div className="flex items-center gap-6">
        {/* Breadcrumbs/Nav */}
        <div id="tour-header-breadcrumbs" className="flex items-center gap-2 text-xs">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Home
          </Link>
          <span className="text-card-border">/</span>
          <span className="text-foreground font-semibold">{activeWorkspace?.name || "My Workspace"}</span>
          <div className="ml-2 px-1.5 py-0.5 rounded bg-foreground/5 border border-card-border text-[10px] text-muted font-bold uppercase tracking-wider">Public</div>
        </div>

        {/* Global Nav Links */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium border-l border-card-border pl-6">
          <button className="text-primary bg-primary/10 px-2.5 py-1 rounded-md">Overview</button>
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
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-60">Signed in as</p>
                    <p className="font-bold text-sm text-foreground truncate">{user?.displayName || "Explorer"}</p>

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
                          className="w-full bg-black/20 border border-primary/30 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all"
                    >
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-white/5 transition-all">
                      Resource Center
                    </button>
                  </div>

                  <div className="h-px bg-card-border/50 my-2" />

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all group"
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

        {/* Updates / Notifications Bell */}
        <button
          onClick={() => setIsUpdatesOpen(true)}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
          title="Updates & Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {pendingCount > 0 && (
            <span className="absolute 1 top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-card-bg shadow-sm shadow-rose-500/50">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>

        {/* Collaborators Facepile */}
        {(collaborators.length > 0 || (activeWorkspace?.ownerId === user?.uid)) && (
          <div className="relative flex items-center ml-2 group/facepile cursor-help pt-2 pb-2">
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
                  {/* Owner Row */}
                  {ownerInfo && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 border border-background flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm relative">
                        {ownerInfo.initial}
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border border-background flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">{ownerInfo.displayName}</span>
                        <span className="text-[10px] text-muted truncate">Owner</span>
                      </div>
                    </div>
                  )}

                  {/* Collaborators Rows */}
                  {collaborators.filter(c => c.userId !== activeWorkspace?.ownerId).map((collab) => (
                    <div key={collab.id} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 text-primary border border-background flex items-center justify-center text-xs font-bold shadow-sm">
                        {collab.initial}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground truncate">{collab.displayName}</span>
                          {/* Role Badge or Edit Selector */}
                          {editingCollabId === collab.id ? (
                            <select
                              value={collab.role}
                              onChange={(e) => handleRoleChange(collab.id, e.target.value)}
                              className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none text-center ${collab.role === 'write' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'}`}
                              title="Change Role"
                            >
                              <option value="read" className="bg-card-bg text-foreground">READ</option>
                              <option value="write" className="bg-card-bg text-foreground">WRITE</option>
                            </select>
                          ) : (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${collab.role === 'write' ? 'bg-primary/20 text-primary' : 'bg-slate-500/20 text-slate-400'}`}>
                              {collab.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted truncate">{collab.email}</span>
                      </div>

                      {/* Owner Actions */}
                      {activeWorkspace?.ownerId === user?.uid && (
                        <div className="ml-auto flex items-center gap-1 pointer-events-auto shrink-0">
                          {editingCollabId === collab.id ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleRemoveCollaborator(collab.id);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Remove Collaborator"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingCollabId(null);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Done Editing"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditingCollabId(collab.id);
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Access"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider before Invite */}
        <div className="h-4 w-px bg-card-border mx-1" />

        <button id="tour-invite-btn" onClick={() => setIsInviteOpen(true)} className="px-3 py-1.5 glass-btn-primary rounded-xl text-[11px] flex items-center gap-1.5 active:scale-95 shadow-lg shadow-primary/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Invite
        </button>

        <div className="h-4 w-px bg-card-border mx-1" />

        <ThemeToggle />
      </div>

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <UpdatesModal isOpen={isUpdatesOpen} onClose={() => setIsUpdatesOpen(false)} />
    </header>
  );
}
