"use client";

import { useState } from "react";
import { useSettings } from "./SettingsProvider";
import { useCollections } from "./CollectionsProvider";
import { SavedRequest } from "@/app/lib/collections";
import Modal from "./Modal";
import Dropdown, { DropdownItem, DropdownSeparator } from "./Dropdown";

const activities = [
  {
    id: 'collections', name: 'Collections', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
    )
  },
  {
    id: 'history', name: 'History', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    )
  },
  {
    id: 'flows', name: 'Flows', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
    )
  },
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
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'createWorkspace' | 'renameWorkspace' | 'createCollection' | 'renameCollection' | 'renameRequest' | 'deleteRequest' | 'deleteCollection' | null;
    data?: any;
  }>({ isOpen: false, type: null });

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateWorkspace = () => {
    setModalState({ isOpen: true, type: 'createWorkspace' });
  };

  const handleRenameWorkspace = () => {
    setModalState({ isOpen: true, type: 'renameWorkspace' });
  };

  const handleCreateCollection = () => {
    setModalState({ isOpen: true, type: 'createCollection' });
  };

  const handleRenameCollection = (id: string, currentName: string) => {
    setModalState({ isOpen: true, type: 'renameCollection', data: { id, name: currentName } });
  };

  const handleRenameRequest = (id: string, collectionId: string, currentName: string) => {
    setModalState({ isOpen: true, type: 'renameRequest', data: { id, collectionId, name: currentName } });
  };

  const handleDeleteRequest = (requestId: string, collectionId: string, name: string) => {
    if (settings.confirmDelete) {
      setModalState({ isOpen: true, type: 'deleteRequest', data: { id: requestId, collectionId, name } });
    } else {
      deleteRequest(requestId, collectionId);
    }
  };

  const handleDeleteCollection = (collectionId: string, name: string) => {
    if (settings.confirmDelete) {
      setModalState({ isOpen: true, type: 'deleteCollection', data: { id: collectionId, name } });
    } else {
      deleteCollection(collectionId);
    }
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
            className={`p-3 rounded-xl transition-all duration-200 group relative ${activeActivity === activity.id
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
          <Dropdown
            trigger={
              <div className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-background/50 border border-card-border/50 hover:border-primary/50 hover:bg-background/80 transition-all group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {activeWorkspace?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-foreground truncate">{activeWorkspace?.name}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary transition-colors"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            }
          >
            <div className="px-2 py-1.5 text-[10px] font-black text-muted uppercase tracking-widest">Switch Workspace</div>
            {workspaces.map(w => (
              <DropdownItem
                key={w.id}
                onClick={() => setActiveWorkspaceId(w.id)}
                className={w.id === activeWorkspaceId ? "bg-primary/10 text-primary" : ""}
                icon={w.id === activeWorkspaceId ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : <div className="w-3" />}
              >
                {w.name}
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <div className="px-2 py-1.5 text-[10px] font-black text-muted uppercase tracking-widest">Actions</div>
            <DropdownItem onClick={handleCreateWorkspace} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}>
              New Workspace
            </DropdownItem>
            <DropdownItem onClick={handleRenameWorkspace} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>}>
              Rename Workspace
            </DropdownItem>
          </Dropdown>
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
                          <span className={`w-10 font-black text-right ${request.method === 'GET' ? 'text-emerald-500' :
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
                      <span className={`w-8 text-[9px] font-black text-right ${item.method === 'GET' ? 'text-emerald-500' :
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

      {/* Resource Modals */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null })}
        title={
          modalState.type === 'createWorkspace' ? 'Create New Workspace' :
            modalState.type === 'renameWorkspace' ? 'Rename Workspace' :
              modalState.type === 'createCollection' ? 'New Collection' :
                modalState.type === 'renameCollection' ? 'Rename Collection' :
                  modalState.type === 'renameRequest' ? 'Rename Request' :
                    'Confirm Action'
        }
        type={modalState.type?.includes('delete') ? 'confirm' : 'input'}
        defaultValue={
          modalState.type === 'renameWorkspace' ? activeWorkspace?.name :
            modalState.type === 'renameCollection' ? modalState.data?.name :
              modalState.type === 'renameRequest' ? modalState.data?.name :
                ''
        }
        placeholder={
          modalState.type === 'createWorkspace' ? 'Enter workspace name...' :
            modalState.type === 'renameWorkspace' ? 'Enter new workspace name...' :
              modalState.type === 'createCollection' ? 'Enter collection name...' :
                modalState.type === 'renameCollection' ? 'Enter new collection name...' :
                  modalState.type === 'renameRequest' ? 'Enter new request name...' :
                    ''
        }
        confirmText={modalState.type?.includes('delete') ? 'Delete' : 'Save'}
        message={
          modalState.type === 'deleteCollection' ? `Are you sure you want to delete collection "${modalState.data?.name}" and all its requests?` :
            modalState.type === 'deleteRequest' ? `Are you sure you want to delete "${modalState.data?.name}"?` :
              undefined
        }
        onConfirm={async (value) => {
          if (modalState.type === 'createWorkspace' && value) {
            await createWorkspace(value);
          } else if (modalState.type === 'renameWorkspace' && value && activeWorkspace) {
            await renameWorkspace(activeWorkspace.id, value);
          } else if (modalState.type === 'createCollection' && value) {
            await createCollection(value);
          } else if (modalState.type === 'renameCollection' && value && modalState.data) {
            await renameCollection(modalState.data.id, value);
          } else if (modalState.type === 'renameRequest' && value && modalState.data) {
            await renameRequest(modalState.data.id, modalState.data.collectionId, value);
          } else if (modalState.type === 'deleteCollection' && modalState.data) {
            await deleteCollection(modalState.data.id);
          } else if (modalState.type === 'deleteRequest' && modalState.data) {
            await deleteRequest(modalState.data.id, modalState.data.collectionId);
          }
        }}
      />
    </div>
  );
}
