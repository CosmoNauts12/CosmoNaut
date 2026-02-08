"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Collection, SavedRequest, saveCollectionsToDisk, loadCollectionsFromDisk } from "@/app/lib/collections";
import { Workspace, loadWorkspacesFromDisk, saveWorkspacesToDisk } from "@/app/lib/workspaces";
import { useAuth } from "./AuthProvider";
import { useSettings } from "./SettingsProvider";
import { CosmoError } from "./RequestEngine";
import { invoke } from "@tauri-apps/api/core";

interface CollectionsContextType {
  collections: Collection[];
  workspaces: Workspace[];
  history: HistoryItem[];
  activeWorkspaceId: string;
  loading: boolean;
  setActiveWorkspaceId: (id: string) => void;
  saveRequest: (request: Omit<SavedRequest, 'id'>, collectionId: string) => Promise<void>;
  updateRequest: (request: SavedRequest, collectionId: string) => Promise<void>;
  deleteRequest: (requestId: string, collectionId: string) => Promise<void>;
  renameRequest: (requestId: string, collectionId: string, newName: string) => Promise<void>;
  createCollection: (name: string) => Promise<string>;
  deleteCollection: (collectionId: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<string>;
  deleteWorkspace: (id: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
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

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("default");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Workspaces on Login
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId("default");
      return;
    }
    
    const loadWorkspaces = async () => {
      setLoading(true);
      try {
        const data = await loadWorkspacesFromDisk(user.uid);
        setWorkspaces(data);
        
        // Restore last active workspace if it exists in the new list
        const lastId = settings.lastWorkspaceId || "default";
        if (data.some(w => w.id === lastId)) {
          setActiveWorkspaceId(lastId);
        } else if (data.length > 0) {
          setActiveWorkspaceId(data[0].id);
        }
      } catch (error) {
        console.error("CollectionsProvider: Load workspaces error", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkspaces();
  }, [user, settings.lastWorkspaceId]);

  // Load Collections when Workspace changes
  useEffect(() => {
    if (!user || !activeWorkspaceId) return;
    
    const loadCollections = async () => {
      setLoading(true);
      try {
        const data = await loadCollectionsFromDisk(user.uid, activeWorkspaceId);
        setCollections(data);
      } catch (error) {
        console.error("CollectionsProvider: Load collections error", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCollections();
    
    // Load History
    const loadHistory = async () => {
        if (!user || !activeWorkspaceId) return;
        try {
            const data = await invoke<string>("load_history", { userId: user.uid, workspaceId: activeWorkspaceId });
            setHistory(JSON.parse(data));
        } catch (error) {
            console.error("CollectionsProvider: Load history error", error);
            setHistory([]);
        }
    };
    loadHistory();
    
    // Persist last active workspace across reloads
    if (settings.lastWorkspaceId !== activeWorkspaceId) {
        updateSettings({ lastWorkspaceId: activeWorkspaceId });
    }
  }, [user, activeWorkspaceId, updateSettings, settings.lastWorkspaceId]);

  const persistCollections = useCallback(async (newCollections: Collection[]) => {
    setCollections(newCollections);
    if (!user || !activeWorkspaceId) return;
    try {
      await saveCollectionsToDisk(user.uid, activeWorkspaceId, newCollections);
    } catch (error) {
      console.error("CollectionsProvider: Persist collections error", error);
    }
  }, [user, activeWorkspaceId]);

  const persistWorkspaces = useCallback(async (newWorkspaces: Workspace[]) => {
    setWorkspaces(newWorkspaces);
    if (!user) return;
    try {
      await saveWorkspacesToDisk(user.uid, newWorkspaces);
    } catch (error) {
      console.error("CollectionsProvider: Persist workspaces error", error);
    }
  }, [user]);

  const createWorkspace = async (name: string) => {
    const id = `w_${Date.now()}`;
    const newWorkspaces = [...workspaces, { id, name }];
    await persistWorkspaces(newWorkspaces);
    setActiveWorkspaceId(id);
    return id;
  };

  const deleteWorkspace = async (id: string) => {
    const newWorkspaces = workspaces.filter(w => w.id !== id);
    await persistWorkspaces(newWorkspaces);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(newWorkspaces[0]?.id || "default");
    }
  };

  const renameWorkspace = async (id: string, name: string) => {
    const newWorkspaces = workspaces.map(w => w.id === id ? { ...w, name } : w);
    await persistWorkspaces(newWorkspaces);
  };

  const createCollection = async (name: string) => {
    const id = `c_${Date.now()}`;
    const newCollections = [...collections, { id, name, requests: [] }];
    await persistCollections(newCollections);
    return id;
  };

  const saveRequest = async (requestData: Omit<SavedRequest, 'id'>, collectionId: string) => {
    const id = `r_${Date.now()}`;
    const newRequest = { ...requestData, id };
    
    const newCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, requests: [...c.requests, newRequest] };
      }
      return c;
    });
    
    await persistCollections(newCollections);
  };

  const updateRequest = async (request: SavedRequest, collectionId: string) => {
    const newCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { 
          ...c, 
          requests: c.requests.map(r => r.id === request.id ? request : r) 
        };
      }
      return c;
    });
    await persistCollections(newCollections);
  };

  const deleteRequest = async (requestId: string, collectionId: string) => {
    const newCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, requests: c.requests.filter(r => r.id !== requestId) };
      }
      return c;
    });
    await persistCollections(newCollections);
  };

  const renameRequest = async (requestId: string, collectionId: string, newName: string) => {
    const newCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { 
          ...c, 
          requests: c.requests.map(r => r.id === requestId ? { ...r, name: newName } : r) 
        };
      }
      return c;
    });
    await persistCollections(newCollections);
  };

  const deleteCollection = async (collectionId: string) => {
    const newCollections = collections.filter(c => c.id !== collectionId);
    await persistCollections(newCollections);
  };

  const renameCollection = async (collectionId: string, newName: string) => {
    const newCollections = collections.map(c => 
      c.id === collectionId ? { ...c, name: newName } : c
    );
    await persistCollections(newCollections);
  };

  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `h_${Date.now()}`,
      timestamp: Date.now()
    };
    const newHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    
    if (user && activeWorkspaceId) {
      try {
        await invoke("save_history", { 
            userId: user.uid, 
            workspaceId: activeWorkspaceId, 
            history: JSON.stringify(newHistory) 
        });
      } catch (error) {
        console.error("CollectionsProvider: Save history error", error);
      }
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    if (user && activeWorkspaceId) {
      try {
        await invoke("save_history", { 
            userId: user.uid, 
            workspaceId: activeWorkspaceId, 
            history: "[]" 
        });
      } catch (error) {
        console.error("CollectionsProvider: Clear history error", error);
      }
    }
  };

  return (
    <CollectionsContext.Provider value={{
      collections,
      workspaces,
      activeWorkspaceId,
      loading,
      setActiveWorkspaceId,
      saveRequest,
      updateRequest,
      deleteRequest,
      renameRequest,
      createCollection,
      deleteCollection,
      renameCollection,
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

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}
