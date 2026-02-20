
import React, { useState } from "react";
import Modal from "./Modal";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./AuthProvider";
import { useCollections } from "./CollectionsProvider";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchUser {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

// Helper to timeout firebase requests. Firestore hangs indefinitely if the DB is not created in the Firebase Console
const withTimeout = <T,>(promise: Promise<T>, ms: number = 8000) => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
    ]);
};

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const { user: currentUser } = useAuth();
    const { activeWorkspaceId, workspaces } = useCollections();
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"read" | "write">("read");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const [searchError, setSearchError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Maintain recent search history in local storage
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Reset UI state when modal is opened/closed
    React.useEffect(() => {
        if (isOpen) {
            setEmail("");
            setSelectedUser(null);
            setSearchResults([]);
            setShowDropdown(false);
            setSuccessMessage("");
            setSearchError("");
            setIsSending(false);

            // Load history
            try {
                const history = localStorage.getItem("inviteSearchHistory");
                if (history) {
                    setSearchHistory(JSON.parse(history));
                }
            } catch (e) {
                console.error("Failed to load search history", e);
            }
        }
    }, [isOpen]);

    // Debounce search
    const [debouncedEmail, setDebouncedEmail] = useState("");

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedEmail(email);
        }, 300);
        return () => clearTimeout(timer);
    }, [email]);

    React.useEffect(() => {
        const performSearch = async () => {
            if (!debouncedEmail.trim()) {
                setSearchResults([]);
                setShowDropdown(false);
                return;
            }

            // If we have selected a user and the email matches, don't search
            if (selectedUser && selectedUser.email === debouncedEmail) {
                return;
            }

            setIsSearching(true);
            setSearchError("");

            try {
                // Search for users with email starting with the input
                // Note: accurate prefix search requires a proper index in Firestore, 
                // but for small datasets or exact matches this works okay.
                // For better prefix search: where('email', '>=', term), where('email', '<=', term + '\uf8ff')
                const term = debouncedEmail.trim().toLowerCase();
                const q = query(
                    collection(db, "users"),
                    where("email", ">=", term),
                    where("email", "<=", term + "\uf8ff")
                );

                const querySnapshot = await getDocs(q);
                const results: SearchUser[] = [];
                querySnapshot.forEach((doc) => {
                    results.push(doc.data() as SearchUser);
                });

                // Removed filter to allow testing with own email as per user feedback
                const filtered = results.slice(0, 5); // Limit to 5

                setSearchResults(filtered);
                setShowDropdown(true);

                if (filtered.length === 0 && term.includes('@') && term.includes('.')) {
                    // Only show error if it looks like a full email but no user found
                    // searching...
                }
            } catch (error: any) {
                console.error("Search error:", error);
                if (error.message === "TIMEOUT") {
                    setSearchError("Database connection timed out.");
                } else {
                    // If the users collection doesn't exist yet or there's a permission error,
                    // we still want to allow inviting by email as an external user.
                    // Instead of blocking with a "Failed to search" error, we pretend we found no users.
                    setSearchError("");
                    setSearchResults([]);
                    setShowDropdown(true);
                }
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedEmail, currentUser, selectedUser]);


    const selectUser = (user: SearchUser) => {
        setSelectedUser(user);
        setEmail(user.email);
        setShowDropdown(false);
        setSearchError("");
    };

    const clearSelection = () => {
        setSelectedUser(null);
        setEmail("");
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleInvite = async () => {
        if (!currentUser || !selectedUser) return;

        // Validation 1: Cannot invite yourself
        if (currentUser.email === selectedUser.email) {
            setSearchError("You cannot invite yourself to collaborate.");
            return;
        }

        // Validation 1.5: Cannot invite the workspace owner
        if (activeWorkspace?.ownerId === selectedUser.uid) {
            setSearchError("This user is already the owner of this workspace.");
            return;
        }

        setIsSending(true);
        setSearchError("");
        try {
            // Validation 2: Prevent inviting existing collaborator to THIS workspace
            if (selectedUser.uid) {
                const collabsQuery = query(
                    collection(db, "collaborators"),
                    where("userId", "==", selectedUser.uid),
                    where("projectId", "==", activeWorkspaceId)
                );
                const collabsSnap = await getDocs(collabsQuery);
                if (!collabsSnap.empty) {
                    setSearchError("This user is already a collaborator in this workspace.");
                    setIsSending(false);
                    return;
                }
            }

            // Validation 3: Prevent duplicate pending invites for THIS workspace
            const invitesQuery = query(
                collection(db, "invitations"),
                where("toEmail", "==", selectedUser.email),
                where("projectId", "==", activeWorkspaceId),
                where("status", "==", "pending")
            );
            const invitesSnap = await getDocs(invitesQuery);
            if (!invitesSnap.empty) {
                setSearchError("An invitation is already pending for this email in this workspace.");
                setIsSending(false);
                return;
            }

            await addDoc(collection(db, "invitations"), {
                fromUserId: currentUser.uid,
                fromEmail: currentUser.email,
                toEmail: selectedUser.email,
                toUserId: selectedUser.uid || null,
                projectId: activeWorkspaceId,
                role,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            // Add to search history on successful send
            try {
                let currentHistory: string[] = [];
                const saved = localStorage.getItem("inviteSearchHistory");
                if (saved) {
                    currentHistory = JSON.parse(saved);
                }
                const newHistory = [selectedUser.email, ...currentHistory.filter(e => e !== selectedUser.email)].slice(0, 5);
                setSearchHistory(newHistory);
                localStorage.setItem("inviteSearchHistory", JSON.stringify(newHistory));
            } catch (e) {
                console.error("Failed to save search history", e);
            }

            setSuccessMessage("Invitation sent successfully!");

            // Reset after a short delay to let the animation play
            setTimeout(() => {
                onClose();
                clearSelection();
                setSuccessMessage("");
                setIsSending(false);
            }, 500);

        } catch (error: any) {
            console.error("Invite error:", error);
            if (error.message === "TIMEOUT") {
                setSearchError("Connection timed out. Please ensure your Firestore Database is created and enabled in the Firebase Console.");
            } else {
                setSearchError("Failed to send invitation. Check console for details.");
            }
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Invite Collaborator" allowOverflow={true}>
            <div className="space-y-6">
                {/* Search Section */}
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Search by Email
                    </label>
                    <div className="flex gap-2 relative">
                        <div className="flex-1 relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (selectedUser) setSelectedUser(null); // Clear selection on edit
                                }}
                                placeholder="colleague@example.com"
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-400"
                                required
                                autoComplete="off"
                            />
                            {(isSearching || email !== debouncedEmail) && (
                                <div className="absolute right-3 top-2.5">
                                    <div className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {searchError && (
                        <div className="mt-2 text-xs text-rose-500 font-medium animate-in slide-in-from-top-1">
                            {searchError}
                        </div>
                    )}

                    {/* Dropdown Results / History */}
                    {!debouncedEmail.trim() && searchHistory.length > 0 && !selectedUser && (
                        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl shadow-sm max-h-60 overflow-y-auto">
                            <div className="p-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Searches</div>
                            {searchHistory.map((historyEmail, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setEmail(historyEmail)}
                                    className="w-full text-left p-3 hover:bg-white transition-colors flex items-center gap-3 border-b border-slate-200/50 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">{historyEmail}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {showDropdown && !selectedUser && debouncedEmail && (
                        <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-sm max-h-60 overflow-y-auto">
                            {searchResults.map((user) => (
                                <button
                                    key={user.uid}
                                    onClick={() => selectUser(user)}
                                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shadow-inner">
                                        {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{user.displayName || "Unknown"}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </button>
                            ))}

                            {/* Option to invite by email if no exact match found or just as an option */}
                            {debouncedEmail.trim() !== "" && searchResults.length === 0 && (
                                <div className="w-full text-center p-4 py-6 flex flex-col items-center justify-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500">User not found</p>
                                    <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">No Cosmonaut user matches that email address.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Section (Selected User) */}
                {selectedUser && !successMessage && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4 mb-4 relative group">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                                {selectedUser.displayName?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{selectedUser.displayName || "Unknown Name"}</p>
                                <p className="text-xs text-slate-500">{selectedUser.email}</p>
                                {!selectedUser.uid && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">External</span>
                                )}
                            </div>
                            <button
                                onClick={clearSelection}
                                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Access Level
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setRole("read")}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${role === "read"
                                            ? "bg-primary text-white border-transparent shadow-[0_4px_14px_0_rgba(2,132,199,0.39)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.23)] hover:brightness-110"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-primary/50"
                                            }`}
                                    >
                                        Read Only
                                    </button>
                                    <button
                                        onClick={() => setRole("write")}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${role === "write"
                                            ? "bg-primary text-white border-transparent shadow-[0_4px_14px_0_rgba(2,132,199,0.39)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.23)] hover:brightness-110"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-primary/50"
                                            }`}
                                    >
                                        Read & Write
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleInvite}
                                disabled={isSending}
                                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_4px_14px_0_rgba(2,132,199,0.39)]"
                            >
                                {isSending ? "Sending Invitation..." : "Send Invitation"}
                            </button>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">Invite Sent!</h3>
                        <p className="text-xs text-slate-500">{successMessage}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
