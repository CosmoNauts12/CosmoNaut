"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Collection, SavedRequest, saveCollectionsToDisk, loadCollectionsFromDisk } from "@/app/lib/collections";
import { useAuth } from "./AuthProvider";

interface CollectionsContextType {
  collections: Collection[];
  loading: boolean;
  saveRequest: (request: Omit<SavedRequest, 'id'>, collectionId: string) => Promise<void>;
  updateRequest: (request: SavedRequest, collectionId: string) => Promise<void>;
  deleteRequest: (requestId: string, collectionId: string) => Promise<void>;
  renameRequest: (requestId: string, collectionId: string, newName: string) => Promise<void>;
  createCollection: (name: string) => Promise<string>;
  deleteCollection: (collectionId: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState("default");

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadCollectionsFromDisk(workspaceId);
        setCollections(data);
      } catch (error) {
        console.error("CollectionsProvider: Load error", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, workspaceId]);

  const persist = useCallback(async (newCollections: Collection[]) => {
    setCollections(newCollections);
    try {
      await saveCollectionsToDisk(workspaceId, newCollections);
    } catch (error) {
      console.error("CollectionsProvider: Persist error", error);
    }
  }, [workspaceId]);

  const createCollection = async (name: string) => {
    const id = `c_${Date.now()}`;
    const newCollections = [...collections, { id, name, requests: [] }];
    await persist(newCollections);
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
    
    await persist(newCollections);
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
    await persist(newCollections);
  };

  const deleteRequest = async (requestId: string, collectionId: string) => {
    const newCollections = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, requests: c.requests.filter(r => r.id !== requestId) };
      }
      return c;
    });
    await persist(newCollections);
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
    await persist(newCollections);
  };

  const deleteCollection = async (collectionId: string) => {
    const newCollections = collections.filter(c => c.id !== collectionId);
    await persist(newCollections);
  };

  const renameCollection = async (collectionId: string, newName: string) => {
    const newCollections = collections.map(c => 
      c.id === collectionId ? { ...c, name: newName } : c
    );
    await persist(newCollections);
  };

  return (
    <CollectionsContext.Provider value={{
      collections,
      loading,
      saveRequest,
      updateRequest,
      deleteRequest,
      renameRequest,
      createCollection,
      deleteCollection,
      renameCollection
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
