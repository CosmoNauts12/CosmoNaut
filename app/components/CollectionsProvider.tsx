"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Collection, SavedRequest, Flow, FlowBlock, saveCollectionsToDisk, loadCollectionsFromDisk } from "@/app/lib/collections";
import { Workspace } from "@/app/lib/workspaces";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth } from "./AuthProvider";
import { useSettings } from "./SettingsProvider";
import { CosmoError } from "./RequestEngine";
import { invoke } from "@tauri-apps/api/core";

/**
 * Collections Context Interface
 * Defines the available data and methods for the CollectionsProvider.
 */
interface CollectionsContextType {
  collections: Collection[];           // List of all collections
  workspaces: Workspace[];             // List of available workspaces
  history: HistoryItem[];              // Request history
  flows: Flow[];                       // List of all flows
  activeWorkspaceId: string;           // Currently selected workspace ID
  loading: boolean;                    // Loading state for data fetching
  currentRole: "owner" | "write" | "read"; // Role of the user in the active workspace

  // Workspace Actions
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (name: string) => Promise<string>;
  deleteWorkspace: (id: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;

  // Collection Actions
  createCollection: (name: string) => Promise<string>;
  deleteCollection: (collectionId: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;

  // Flow Actions
  createFlow: (name: string) => Promise<string>;
  updateFlow: (flow: Flow) => Promise<void>;
  deleteFlow: (flowId: string) => Promise<void>;
  renameFlow: (flowId: string, newName: string) => Promise<void>;

  // Request Actions
  saveRequest: (request: Omit<SavedRequest, 'id'>, collectionId: string) => Promise<void>;
  updateRequest: (request: SavedRequest, collectionId: string) => Promise<void>;
  deleteRequest: (requestId: string, collectionId: string) => Promise<void>;
  renameRequest: (requestId: string, collectionId: string, newName: string) => Promise<void>;

  // History Actions
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  params: any[];
  headers: any[];
  auth: any;
  body: string;
  timestamp: number;
  status: number;
  duration_ms: number;
  error?: CosmoError;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

/**
 * Global state provider for managing workspaces, collections, and request history.
 * Handles disk persistence and reactive updates across the application.
 */
export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemo } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("default");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Workspaces on Login (Real-time Firestore Sync)
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspaces([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveWorkspaceId("default");
      return;
    }

    if (isDemo) {
      setWorkspaces([{
        id: "demo-workspace",
        name: "Demo Workspace",
        ownerId: "demo-user",
        isOwner: true
      } as any]);
      setActiveWorkspaceId("demo-workspace");
      setLoading(false);
      return;
    }

    setLoading(true);

    let ownedWorkspaces: Workspace[] = [];
    let collabWorkspaces: Workspace[] = [];

    const getRoleForWorkspace = (wId: string): "owner" | "write" | "read" => {
      if (ownedWorkspaces.some(w => w.id === wId)) return "owner";
      const collab = collabWorkspaces.find(w => w.id === wId);
      if (collab && (collab as any).role) return (collab as any).role as "write" | "read";
      return "read"; // fallback
    };

    const combineAndSet = () => {
      const combined = [...ownedWorkspaces, ...collabWorkspaces];

      // Remove duplicates just in case
      const uniqueWorkspaces = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setWorkspaces(uniqueWorkspaces);

      const lastId = settings.lastWorkspaceId || "default";
      if (uniqueWorkspaces.some(w => w.id === lastId)) {
        setActiveWorkspaceId(lastId);
      } else if (uniqueWorkspaces.length > 0) {
        setActiveWorkspaceId(uniqueWorkspaces[0].id);
      } else {
        // If absolutely no workspaces exist, ensure we don't crash
        setActiveWorkspaceId("default");
      }
      setLoading(false);
    };

    // 1. Listen for Workspaces owned by the user
    const qOwned = query(collection(db, "workspaces"), where("ownerId", "==", user.uid));
    const unsubOwned = onSnapshot(qOwned, (snapshot) => {
      ownedWorkspaces = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, ownerId: doc.data().ownerId, isOwner: true } as any));
      combineAndSet();
    }, (error) => {
      console.error("Firestore owned workspaces sync error:", error);
    });

    // 2. Listen for Workspaces where user is a collaborator
    const qCollab = query(collection(db, "collaborators"), where("userId", "==", user.uid));
    const unsubCollab = onSnapshot(qCollab, async (snapshot) => {
      const workspaceIds = snapshot.docs.map(doc => doc.data().projectId);

      // If no collaborations, just clear the collab list and recombine
      if (workspaceIds.length === 0) {
        collabWorkspaces = [];
        combineAndSet();
        return;
      }

      // Note: fetching them one by one for now since "in" query has a limit of 10.
      // In a very large app, we would cache or batch this.
      try {
        const fetchedCollabs = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const id = docSnapshot.data().projectId;
            const role = docSnapshot.data().role;
            const wDoc = await getDoc(doc(db, "workspaces", id));
            // Add ownerId manually so facepile knows who the owner is even if not them
            if (wDoc.exists()) {
              return { id: wDoc.id, name: wDoc.data().name, ownerId: wDoc.data().ownerId, isCollab: true, role } as any;
            }
            return null;
          })
        );
        collabWorkspaces = fetchedCollabs.filter(Boolean);
        combineAndSet();
      } catch (e) {
        console.error("Failed to fetch collaboration workspaces", e);
      }
    }, (error) => {
      console.error("Firestore collab sync error:", error);
    });

    return () => {
      unsubOwned();
      unsubCollab();
    };
  }, [user, isDemo]);

  // Load Collections when Workspace changes (Real-time Firestore Sync)
  useEffect(() => {
    if (!user || !activeWorkspaceId || activeWorkspaceId === "default") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollections([]);
      return;
    }

    if (isDemo) {
      setCollections([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = collection(db, "workspaces", activeWorkspaceId, "collections");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Collection[];
      setCollections(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore collections sync error:", error);
      setCollections([]);
      setLoading(false);
    });

    // Load History (Real-time Firestore Sync)
    const qHistory = query(collection(db, "workspaces", activeWorkspaceId, "history"));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      // Sort by timestamp descending
      data.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(data.slice(0, 50)); // Only keep latest 50 for local render
    }, (error) => {
      console.error("Firestore history sync error:", error);
      setHistory([]);
    });

    // Load Flows (Real-time Firestore Sync)
    const qFlows = collection(db, "workspaces", activeWorkspaceId, "flows");
    const unsubFlows = onSnapshot(qFlows, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flow[];
      // Sort by createdAt descending
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setFlows(data);
    }, (error) => {
      console.error("Firestore flows sync error:", error);
      setFlows([]);
    });

    // Persist last active workspace across reloads
    if (settings.lastWorkspaceId !== activeWorkspaceId) {
      updateSettings({ lastWorkspaceId: activeWorkspaceId });
    }
    return () => {
      unsubscribe(); // Cleanup collections
      unsubHistory(); // Cleanup history
      unsubFlows(); // Cleanup flows
    };
  }, [user, isDemo, activeWorkspaceId, updateSettings, settings.lastWorkspaceId]);

  const currentRole = useMemo(() => {
    if (activeWorkspaceId === "default") return "owner";
    const w = workspaces.find(ws => ws.id === activeWorkspaceId);
    if (!w) return "owner";
    if ((w as any).isOwner) return "owner";
    return (w as any).role || "read";
  }, [activeWorkspaceId, workspaces]);

  /**
   * Creates a new workspace and sets it as active.
   */
  const createWorkspace = async (name: string) => {
    if (!user) return "";
    const id = `w_${Date.now()}`;

    if (isDemo) {
      setWorkspaces(prev => [...prev, { id, name, ownerId: "demo-user", isOwner: true } as any]);
      setActiveWorkspaceId(id);
      return id;
    }

    try {
      await setDoc(doc(db, "workspaces", id), {
        name,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      setActiveWorkspaceId(id);
    } catch (e) {
      console.error("Failed to create workspace in Firestore:", e);
    }
    return id;
  };

  /**
   * Deletes a workspace and switches to another if necessary.
   */
  const deleteWorkspace = async (id: string) => {
    if (currentRole === "read") return;

    if (isDemo) {
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(remaining[0]?.id || "default");
      }
      return;
    }

    try {
      await deleteDoc(doc(db, "workspaces", id));
      if (activeWorkspaceId === id) {
        // Find another workspace to switch to
        const remaining = workspaces.filter(w => w.id !== id);
        setActiveWorkspaceId(remaining[0]?.id || "default");
      }
    } catch (e) {
      console.error("Failed to delete workspace in Firestore:", e);
    }
  };

  /**
   * Renames an existing workspace.
   */
  const renameWorkspace = async (id: string, name: string) => {
    if (currentRole === "read") return;

    if (isDemo) {
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } as any : w));
      return;
    }

    try {
      await setDoc(doc(db, "workspaces", id), { name }, { merge: true });
    } catch (e) {
      console.error("Failed to rename workspace in Firestore:", e);
    }
  };

  /**
   * Creates a new empty collection in the active workspace.
   */
  const createCollection = async (name: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return "";
    const id = `c_${Date.now()}`;

    if (isDemo) {
      setCollections(prev => [...prev, { name, requests: [], id, createdAt: new Date() as any }]);
      return id;
    }

    try {
      await setDoc(doc(db, "workspaces", activeWorkspaceId, "collections", id), {
        name,
        requests: [],
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to create collection in Firestore:", e);
    }
    return id;
  };

  /**
   * Saves a new request to a specific collection.
   */
  const saveRequest = async (requestData: Omit<SavedRequest, 'id'>, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const id = `r_${Date.now()}`;
    const newRequest = { ...requestData, id };

    if (isDemo) {
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, requests: [...c.requests, newRequest] } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId), {
        requests: [...targetCollection.requests, newRequest]
      });
    } catch (e) {
      console.error("Failed to save request in Firestore:", e);
    }
  };

  /**
   * Updates an existing request within a collection.
   */
  const updateRequest = async (request: SavedRequest, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, requests: c.requests.map(r => r.id === request.id ? request : r) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === request.id ? request : r);
    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId), {
        requests: newRequests
      });
    } catch (e) {
      console.error("Failed to update request in Firestore:", e);
    }
  };

  /**
   * Deletes a request from a collection.
   */
  const deleteRequest = async (requestId: string, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, requests: c.requests.filter(r => r.id !== requestId) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.filter(r => r.id !== requestId);
    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId), {
        requests: newRequests
      });
    } catch (e) {
      console.error("Failed to delete request in Firestore:", e);
    }
  };

  /**
   * Renames a request within a collection.
   */
  const renameRequest = async (requestId: string, collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, requests: c.requests.map(r => r.id === requestId ? { ...r, name: newName } : r) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === requestId ? { ...r, name: newName } : r);
    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId), {
        requests: newRequests
      });
    } catch (e) {
      console.error("Failed to rename request in Firestore:", e);
    }
  };

  /**
   * Deletes a collection and all its requests.
   */
  const deleteCollection = async (collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      return;
    }

    try {
      await deleteDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId));
    } catch (e) {
      console.error("Failed to delete collection in Firestore:", e);
    }
  };

  /**
   * Renames a collection.
   */
  const renameCollection = async (collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, name: newName } : c));
      return;
    }

    try {
      await setDoc(doc(db, "workspaces", activeWorkspaceId, "collections", collectionId), { name: newName }, { merge: true });
    } catch (e) {
      console.error("Failed to rename collection in Firestore:", e);
    }
  };

  /**
   * Creates a new empty flow in the active workspace.
   */
  const createFlow = async (name: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return "";
    const id = `f_${Date.now()}`;
    const now = Date.now();

    const defaultBlock: FlowBlock = {
      id: `b_${now}`,
      name: "New API Step",
      method: "GET",
      url: "",
      params: [{ key: '', value: '', enabled: true }],
      headers: [{ key: '', value: '', enabled: true }],
      body: "",
      order: 0,
      x: 100,
      y: 100
    };

    if (isDemo) {
      setFlows(prev => [...prev, { id, name, blocks: [defaultBlock], createdAt: now, updatedAt: now }]);
      return id;
    }

    try {
      await setDoc(doc(db, "workspaces", activeWorkspaceId, "flows", id), {
        name,
        blocks: [defaultBlock],
        createdAt: now,
        updatedAt: now
      });
    } catch (e) {
      console.error("Failed to create flow in Firestore:", e);
    }
    return id;
  };

  /**
   * Updates an existing flow.
   */
  const updateFlow = async (flow: Flow) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const now = Date.now();
    const updatedFlow = { ...flow, updatedAt: now };

    if (isDemo) {
      setFlows(prev => prev.map(f => f.id === flow.id ? updatedFlow : f));
      return;
    }

    try {
      await setDoc(doc(db, "workspaces", activeWorkspaceId, "flows", flow.id), updatedFlow);
    } catch (e) {
      console.error("Failed to update flow in Firestore:", e);
    }
  };

  /**
   * Deletes a flow.
   */
  const deleteFlow = async (flowId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setFlows(prev => prev.filter(f => f.id !== flowId));
      return;
    }

    try {
      await deleteDoc(doc(db, "workspaces", activeWorkspaceId, "flows", flowId));
    } catch (e) {
      console.error("Failed to delete flow in Firestore:", e);
    }
  };

  /**
   * Renames a flow.
   */
  const renameFlow = async (flowId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const now = Date.now();

    if (isDemo) {
      setFlows(prev => prev.map(f => f.id === flowId ? { ...f, name: newName, updatedAt: now } : f));
      return;
    }

    try {
      await updateDoc(doc(db, "workspaces", activeWorkspaceId, "flows", flowId), {
        name: newName,
        updatedAt: now
      });
    } catch (e) {
      console.error("Failed to rename flow in Firestore:", e);
    }
  };

  /**
   * Adds a successful or failed request to the persistent history log.
   */
  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default") return;
    const newItem: HistoryItem = {
      ...item,
      id: `h_${Date.now()}`,
      timestamp: Date.now()
    };

    // Firestore does not support undefined values
    if (newItem.error === undefined) {
      delete newItem.error;
    }

    if (isDemo) {
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      return;
    }

    try {
      await setDoc(doc(db, "workspaces", activeWorkspaceId, "history", newItem.id), newItem);
    } catch (error) {
      console.error("Failed to add history in Firestore:", error);
    }
  };

  /**
   * Clears the history for the active workspace.
   */
  const clearHistory = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setHistory([]);
      return;
    }

    try {
      const historyCol = collection(db, "workspaces", activeWorkspaceId, "history");
      // Since it's client-side without batch limits usually hit here (max 50), looping is fine for clear.
      history.forEach(async (h) => {
        await deleteDoc(doc(db, "workspaces", activeWorkspaceId, "history", h.id));
      });
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear history in Firestore:", error);
    }
  };

  return (
    <CollectionsContext.Provider value={{
      collections,
      workspaces,
      flows,
      activeWorkspaceId,
      loading,
      currentRole,
      setActiveWorkspaceId,
      saveRequest,
      updateRequest,
      deleteRequest,
      renameRequest,
      createCollection,
      deleteCollection,
      renameCollection,
      createFlow,
      updateFlow,
      deleteFlow,
      renameFlow,
      createWorkspace,
      deleteWorkspace,
      renameWorkspace,
      history,
      addToHistory,
      clearHistory
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}

/**
 * Custom hook to access collections and workspace data.
 * Must be used within a CollectionsProvider.
 * 
 * @returns {CollectionsContextType} The collections context values
 * @throws {Error} If used outside of a CollectionsProvider
 */
export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}
