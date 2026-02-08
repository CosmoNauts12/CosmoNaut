"use client";

import { useState } from "react";
import { useSettings } from "./SettingsProvider";
import { useCollections } from "./CollectionsProvider";
import { SavedRequest } from "@/app/lib/collections";

const activities = [
  { id: 'collections', name: 'Collections', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  )},
  { id: 'history', name: 'History', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  )},
  { id: 'flows', name: 'Flows', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  )},
];

export default function WorkspaceSidebar({ onSelectRequest }: { onSelectRequest?: (request: SavedRequest & { collectionId: string }) => void }) {
  const { settings } = useSettings();
  const { 
    collections, 
    workspaces, 
    history: requestHistory,
    activeWorkspaceId, 
    setActiveWorkspaceId,
    createCollection, 
    deleteCollection, 
    renameCollection,
    deleteRequest, 
    renameRequest,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    clearHistory
  } = useCollections();
  
  const [activeActivity, setActiveActivity] = useState('collections');
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateWorkspace = async () => {
    const name = window.prompt("Workspace Name:");
    if (name) {
      await createWorkspace(name);
    }
  };

  const handleRenameWorkspace = async () => {
    const name = window.prompt("New Workspace Name:", activeWorkspace?.name);
    if (name && activeWorkspace) {
      await renameWorkspace(activeWorkspace.id, name);
    }
  };

  const handleCreateCollection = async () => {
    const name = window.prompt("Collection Name:");
    if (name) {
      await createCollection(name);
    }
  };

  const handleRenameCollection = async (id: string, currentName: string) => {
    const name = window.prompt("Rename Collection:", currentName);
    if (name) {
      await renameCollection(id, name);
    }
  };

  const handleRenameRequest = async (id: string, collectionId: string, currentName: string) => {
    const name = window.prompt("Rename Request:", currentName);
    if (name) {
      await renameRequest(id, collectionId, name);
    }
  };

  const handleDeleteRequest = async (requestId: string, collectionId: string, name: string) => {
    if (settings.confirmDelete) {
      if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
      }
    }
    await deleteRequest(requestId, collectionId);
  };

  const handleDeleteCollection = async (collectionId: string, name: string) => {
    if (settings.confirmDelete) {
      if (!window.confirm(`Are you sure you want to delete collection "${name}" and all its requests?`)) {
        return;
      }
    }
    await deleteCollection(collectionId);
  };

  return (
    <div className="flex h-full border-r border-card-border bg-card-bg/50 backdrop-blur-xl transition-colors duration-500">
      {/* Activity Bar (Narrow Left) */}
      <div id="tour-activity-bar" className="w-14 flex flex-col items-center py-4 border-r border-card-border/50 gap-2">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => setActiveActivity(activity.id)}
            title={activity.name}
            className={`p-3 rounded-xl transition-all duration-200 group relative ${
              activeActivity === activity.id 
                ? 'text-primary bg-primary/10' 
                : 'text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            {activity.icon}
            {activeActivity === activity.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
            )}
          </button>
        ))}
      </div>

      {/* Sidebar Content (Contextual) */}
      <div id="tour-sidebar-content" className="w-64 flex flex-col bg-transparent overflow-hidden">
        {/* Workspace Switcher */}
        <div className="p-4 border-b border-card-border/50 bg-black/5 dark:bg-white/5">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-muted uppercase tracking-widest">Active Workspace</span>
              <div className="flex gap-1">
                <button onClick={handleCreateWorkspace} className="p-1 hover:bg-foreground/5 rounded text-muted transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                <button onClick={handleRenameWorkspace} className="p-1 hover:bg-foreground/5 rounded text-muted transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
              </div>
           </div>
           <select 
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              className="glass-select w-full rounded-lg px-2 py-1.5 text-xs font-bold focus:border-primary/50"
           >
              {workspaces.map(w => (
                <option key={w.id} value={w.id} className="bg-background">{w.name}</option>
              ))}
           </select>
        </div>

        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] opacity-50">
              {activeActivity}
            </h2>
            <div className="flex gap-1">
              <button 
                onClick={handleCreateCollection}
                className="p-1 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
                title="New Collection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button className="px-2 py-0.5 rounded-md hover:bg-foreground/5 text-muted hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-wider">
                Import
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder={`Search ${activeActivity}...`}
              className="w-full bg-foreground/5 border border-card-border/50 rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-all focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
            {activeActivity === 'collections' && collections.map(collection => (
              <div key={collection.id} className="space-y-1">
                <div className="group relative flex items-center">
                  <button 
                    onClick={() => toggleCollection(collection.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-foreground/5 text-xs font-semibold text-foreground/80 group transition-colors"
                  >
                    <svg 
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform duration-200 ${expandedCollections.includes(collection.id) ? 'rotate-90' : ''} text-muted/50`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/80"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span className="truncate">{collection.name}</span>
                  </button>
                  <div className="absolute right-1 hidden group-hover:flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRenameCollection(collection.id, collection.name); }}
                      className="p-1 hover:bg-foreground/10 text-muted hover:text-foreground rounded transition-all"
                      title="Rename"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCollection(collection.id, collection.name); }}
                      className="p-1 hover:bg-rose-500/10 text-muted hover:text-rose-500 rounded transition-all"
                      title="Delete"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>

                {expandedCollections.includes(collection.id) && (
                  <div className="ml-4 pl-2 border-l border-card-border/50 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {collection.requests.map(request => (
                      <div key={request.id} className="group relative flex items-center">
                        <button 
                          onClick={() => onSelectRequest?.({ ...request, collectionId: collection.id })}
                          className="flex-1 flex items-center gap-4 py-1.5 px-2 rounded-md hover:bg-primary/5 text-[10px] font-medium transition-colors group/item"
                        >
                          <span className={`w-10 font-black text-right ${
                            request.method === 'GET' ? 'text-emerald-500' : 
                            request.method === 'POST' ? 'text-amber-500' :
                            request.method === 'PUT' ? 'text-blue-500' : 'text-rose-500'
                          }`}>
                            {request.method}
                          </span>
                          <span className="truncate text-muted group-hover/item:text-foreground transition-colors">{request.name}</span>
                        </button>
                        
                        <div className="absolute right-1 hidden group-hover:flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRenameRequest(request.id, collection.id, request.name); }}
                            className="p-1 hover:bg-foreground/10 text-muted hover:text-foreground rounded transition-all"
                            title="Rename"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(request.id, collection.id, request.name); }}
                            className="p-1 hover:bg-rose-500/10 text-muted hover:text-rose-500 rounded transition-all"
                            title="Delete"
                          >
                             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {collection.requests.length === 0 && (
                      <p className="p-2 text-[9px] text-muted italic">Empty Collection</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {activeActivity === 'history' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">Recent Activity</span>
                  <button 
                    onClick={clearHistory}
                    className="text-[9px] font-black text-muted hover:text-rose-500 uppercase tracking-widest transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                {requestHistory.length === 0 ? (
                  <div className="p-8 text-center bg-foreground/5 rounded-xl border border-dashed border-card-border/50">
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">No History Yet</p>
                  </div>
                ) : (
                  requestHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectRequest?.({
                        id: item.id,
                        name: item.url.split('/').pop() || item.url,
                        method: item.method,
                        url: item.url,
                        params: item.params,
                        headers: item.headers,
                        auth: item.auth,
                        body: item.body,
                        collectionId: 'history'
                      })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-foreground/5 text-left transition-all group"
                    >
                      <span className={`w-8 text-[9px] font-black text-right ${
                        item.method === 'GET' ? 'text-emerald-500' : 
                        item.method === 'POST' ? 'text-amber-500' :
                        item.method === 'PUT' ? 'text-blue-500' : 'text-rose-500'
                      }`}>
                        {item.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-foreground/80 truncate">{item.url}</p>
                        <p className="text-[9px] text-muted font-medium">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.error ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        ) : (
                          <span className={`text-[9px] font-black ${item.status < 400 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
