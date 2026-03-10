
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, addDoc } from "firebase/firestore";
import { useAuth } from "./AuthProvider";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Invitation {
    id: string;
    fromEmail: string;
    fromUserId: string;
    projectId: string;
    role: "read" | "write";
    status: "pending" | "accepted" | "declined";
    createdAt: any;
}

export default function UpdatesModal({ isOpen, onClose }: UpdatesModalProps) {
    const { user, isDemo } = useAuth();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [appUpdate, setAppUpdate] = useState<any>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<string>("");

    // Check for app updates
    useEffect(() => {
        if (!isOpen) return;

        async function checkForUpdates() {
            try {
                setCheckingUpdate(true);
                setUpdateStatus("Checking for updates...");
                const update = await check();
                if (update) {
                    setAppUpdate(update);
                    setUpdateStatus(`Update v${update.version} available`);
                } else {
                    setUpdateStatus("App is up to date");
                }
            } catch (error) {
                console.error("Failed to check for updates:", error);
                setUpdateStatus("Could not check for updates");
            } finally {
                setCheckingUpdate(false);
            }
        }

        checkForUpdates();
    }, [isOpen]);

    // Listen for real-time updates to invitations
    useEffect(() => {
        if (!user?.email || isDemo) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInvitations([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "invitations"),
            where("toEmail", "==", user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invites: Invitation[] = [];
            snapshot.forEach((doc) => {
                invites.push({ id: doc.id, ...doc.data() } as Invitation);
            });
            // Client-side sort since we don't have a composite index for orderBy createdAt yet
            invites.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setInvitations(invites);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to invitations:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (inviteId: string, fromUserId: string, role: string, projectId: string) => {
        if (!user) return;
        try {
            // Add to collaborators collection
            await addDoc(collection(db, "collaborators"), {
                userId: user.uid,
                role: role,
                projectId: projectId,
                addedAt: new Date()
            });

            // Update invitation status
            await updateDoc(doc(db, "invitations", inviteId), {
                status: "accepted"
            });
            // In a real app, this would also trigger backend logic to grant workspace access
            // For now, we update UI state via the listener
        } catch (error) {
            console.error("Error accepting invite:", error);
            alert("Failed to accept invitation");
        }
    };

    const handleDecline = async (inviteId: string) => {
        if (!confirm("Are you sure you want to decline this invitation?")) return;
        try {
            await updateDoc(doc(db, "invitations", inviteId), {
                status: "rejected"
            });
        } catch (error) {
            console.error("Error declining invite:", error);
            alert("Failed to decline invitation");
        }
    };

    const handleUpdate = async () => {
        if (!appUpdate) return;
        try {
            setUpdateStatus("Downloading update...");
            let downloaded = 0;
            let contentLength: number | undefined = 0;

            await appUpdate.downloadAndInstall((event: any) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength;
                        setUpdateStatus(`Downloading: 0%`);
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        const percentage = contentLength ? Math.round((downloaded / contentLength) * 100) : 0;
                        setUpdateStatus(`Downloading: ${percentage}%`);
                        break;
                    case 'Finished':
                        setUpdateStatus('Update installed. Restarting...');
                        relaunch();
                        break;
                }
            });
        } catch (error) {
            console.error("Update failed:", error);
            alert("Update failed: " + error);
            setUpdateStatus("Update failed");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inbox & Updates">
            <div className="min-h-[200px] flex flex-col gap-6">
                {/* App Update Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${appUpdate ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">System Update</h4>
                                <p className="text-xs text-slate-500">{updateStatus}</p>
                            </div>
                        </div>
                        {appUpdate && (
                            <button
                                onClick={handleUpdate}
                                disabled={updateStatus.includes("Downloading")}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                            >
                                {updateStatus.includes("Downloading") ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                )}
                                Update Now
                            </button>
                        )}
                        {!appUpdate && !checkingUpdate && (
                            <button
                                onClick={() => {
                                    // Trigger a re-check
                                    setAppUpdate(null);
                                    setCheckingUpdate(true);
                                    check().then(u => {
                                        setAppUpdate(u);
                                        if (u) setUpdateStatus(`Update v${u.version} available`);
                                        else setUpdateStatus("App is up to date");
                                        setCheckingUpdate(false);
                                    }).catch(() => {
                                        setUpdateStatus("Check failed");
                                        setCheckingUpdate(false);
                                    });
                                }}
                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Check for updates"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={checkingUpdate ? 'animate-spin' : ''}>
                                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                                    <polyline points="21 3 21 8 16 8"></polyline>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-300">
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        <p className="text-sm font-medium text-slate-500">No new updates</p>
                        <p className="text-xs text-slate-400 mt-1">Check back later for invitations</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Activity Log</h4>
                        {invitations.map((invite) => {
                            const isPending = invite.status === "pending";
                            return (
                                <div key={invite.id} className={`p-4 border rounded-xl shadow-sm transition-all flex items-center justify-between group ${isPending ? 'bg-white border-blue-200 ring-1 ring-blue-100 hover:shadow-md' : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPending ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {invite.fromEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isPending ? 'text-slate-800' : 'text-slate-600'}`}>
                                                Top Secret Project
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Invited by <span className="font-medium text-slate-700">{invite.fromEmail}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${invite.role === 'write' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {invite.role === 'write' ? 'Editor Access' : 'Viewer Access'}
                                                </span>
                                                {!isPending && (
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${invite.status === 'accepted' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        • {invite.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isPending && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDecline(invite.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                title="Decline"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                            <button
                                                onClick={() => handleAccept(invite.id, invite.fromUserId, invite.role, invite.projectId)}
                                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Accept
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}
