"use client";

import { useState, useEffect } from "react";
import { useSettings } from "./SettingsProvider";
import { executeRequest, CosmoResponse } from "./RequestEngine";
import { useCollections } from "./CollectionsProvider";
import { SavedRequest, KVItem, AuthState } from "@/app/lib/collections";
import { ParamsTab, AuthTab, HeadersTab, BodyTab } from "./RequestBuilderTabs";

const methods = ["GET", "POST", "PUT", "DELETE"];

export type ActiveRequest = (SavedRequest & { collectionId: string }) | {
  id: string;
  name: string;
  method: string;
};

/**
 * The main panel for building and sending HTTP requests.
 * Manages URL normalization, header/auth injection, and execution lifecycle.
 * 
 * @param activeRequest The currently focused request (metadata or saved).
 * @param onResponse Callback triggered when a response is received.
 * @param onExecuting Callback triggered when the request starts/ends execution.
 */
export default function RequestPanel({
  activeRequest,
  onResponse,
  onExecuting
}: {
  activeRequest: ActiveRequest;
  onResponse: (res: CosmoResponse | null) => void;
  onExecuting: (executing: boolean) => void;
}) {
  const { settings } = useSettings();
  const { collections, saveRequest, updateRequest, createCollection, addToHistory } = useCollections();
  const [method, setMethod] = useState(activeRequest.method);
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [activeTab, setActiveTab] = useState("params");

  // Unified Request State
  const [params, setParams] = useState<KVItem[]>([{ key: '', value: '', enabled: true }]);
  const [auth, setAuth] = useState<AuthState>({ type: 'none' });
  const [headers, setHeaders] = useState<KVItem[]>([{ key: '', value: '', enabled: true }]);
  const [body, setBody] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState(activeRequest.name);
  const [targetCollectionId, setTargetCollectionId] = useState("");

  useEffect(() => {
    if ('url' in activeRequest) {
      // Rehydrate from SavedRequest
      setMethod(activeRequest.method);
      setUrl(activeRequest.url);
      setParams(activeRequest.params);
      setAuth(activeRequest.auth);
      setHeaders(activeRequest.headers);
      setBody(activeRequest.body);
      setSaveName(activeRequest.name);
    } else {
      // Default / Metadata
      setMethod(activeRequest.method);
      if (activeRequest.name === 'Get All Users') {
        setUrl("https://jsonplaceholder.typicode.com/posts/1");
      }
      setSaveName(activeRequest.name);
    }
  }, [activeRequest]);

  /**
   * Cleans the URL input by removing redundant method prefixes and ensuring protocol.
   * @param input Raw URL string.
   */
  const cleanUrl = (input: string) => {
    let cleaned = input.trim();

    // Strip leading method names if user pasted them (e.g. "GET https://...")
    for (const m of methods) {
      if (cleaned.toUpperCase().startsWith(`${m} `)) {
        cleaned = cleaned.substring(m.length + 1).trim();
        break;
      }
    }

    // Ensure protocol
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }

    return cleaned;
  };

  /**
   * Orchestrates the request execution flow:
   * 1. Normalizes parameters into the URL.
   * 2. Synthesizes final headers from UI state and Auth.
   * 3. Validates JSON body.
   * 4. Invokes the Rust engine.
   * 5. Logs results to history.
   */
  const handleSend = async () => {
    onExecuting(true);
    let targetUrl = cleanUrl(url);

    // 1. Normalize Params
    const activeParams = params.filter((p: KVItem) => p.enabled && p.key.trim());
    if (activeParams.length > 0) {
      const urlObj = new URL(targetUrl);
      activeParams.forEach((p: KVItem) => urlObj.searchParams.append(p.key, p.value));
      targetUrl = urlObj.toString();
    }

    // 2. Normalize Headers & Auth
    const finalHeaders: Record<string, string> = {};

    // User headers
    headers.filter((h: KVItem) => h.enabled && h.key.trim()).forEach((h: KVItem) => {
      finalHeaders[h.key] = h.value;
    });

    // Auth headers
    if (auth.type === 'bearer' && auth.bearerToken) {
      finalHeaders['Authorization'] = `Bearer ${auth.bearerToken}`;
    } else if (auth.type === 'basic' && auth.username) {
      const credentials = btoa(`${auth.username}:${auth.password || ''}`);
      finalHeaders['Authorization'] = `Basic ${credentials}`;
    }

    // Auto headers
    if (method !== 'GET' && body.trim()) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    // 3. Normalize Body
    let finalBody: string | undefined = undefined;
    if (method !== 'GET' && body.trim()) {
      try {
        JSON.parse(body); // Validation
        finalBody = body;
      } catch (e) {
        alert("Invalid JSON body payload.");
        onExecuting(false);
        return;
      }
    }

    try {
      const response = await executeRequest({
        method,
        url: targetUrl,
        headers: finalHeaders,
        body: finalBody,
      });
      onResponse(response);

      // Persist to History
      await addToHistory({
        method,
        url: targetUrl,
        params,
        headers,
        auth,
        body,
        status: response.status,
        duration_ms: response.duration_ms,
        error: response.error
      });
    } catch (error: any) {
      console.error("Critical Execution Error:", error);
    } finally {
      onExecuting(false);
    }
  };

  /**
   * Handles saving or updating the current request to a collection.
   */
  const handleSave = async () => {
    if (!saveName.trim()) return alert("Please enter a name");

    if (!showSaveModal && 'url' in activeRequest) {
      // Direct update
      await updateRequest({
        id: activeRequest.id,
        name: saveName,
        method,
        url,
        params,
        auth,
        headers,
        body
      }, activeRequest.collectionId);
      return;
    }

    // Save as new or show modal logic
    let collectionId = targetCollectionId;
    if (!collectionId && collections.length > 0) {
      collectionId = collections[0].id;
    }

    if (!collectionId) {
      collectionId = await createCollection("My Requests");
    }

    await saveRequest({
      name: saveName,
      method,
      url,
      params,
      auth,
      headers,
      body
    }, collectionId);

    setShowSaveModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-card-bg/20 backdrop-blur-sm">
      {/* Search/URL Bar */}
      <div className="p-4 border-b border-card-border bg-black/5 dark:bg-white/5 space-y-4">
        <div className="flex gap-2">
          <div className="relative group">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className={`glass-select h-11 px-4 rounded-xl font-black text-xs appearance-none focus:border-primary/50 ${method === 'GET' ? 'text-emerald-500' :
                  method === 'POST' ? 'text-amber-500' :
                    method === 'PUT' ? 'text-blue-500' : 'text-rose-500'
                }`}
            >
              {methods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted opacity-50">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 h-11 px-4 rounded-xl border border-card-border/50 bg-card-bg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-all shadow-inner"
          />

          {'url' in activeRequest ? (
            <>
              <button
                onClick={handleSave}
                className="h-11 px-6 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Update
              </button>
              <button
                onClick={() => {
                  setTargetCollectionId(activeRequest.collectionId);
                  setSaveName(`${activeRequest.name} (Copy)`);
                  setShowSaveModal(true);
                }}
                className="h-11 px-6 rounded-xl border border-card-border/50 bg-card-bg text-muted text-xs font-black uppercase tracking-widest hover:text-foreground transition-all"
              >
                Save As
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (collections.length > 0) setTargetCollectionId(collections[0].id);
                setShowSaveModal(true);
              }}
              className="h-11 px-6 rounded-xl border border-card-border/50 bg-card-bg text-muted text-xs font-black uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Save
            </button>
          )}

          <button
            onClick={handleSend}
            className="h-11 px-8 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Send
          </button>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
            <div className="relative w-full max-w-md liquid-glass p-8 rounded-[2.5rem] border-primary/20 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-6">Save Request</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Name</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-card-border/50 bg-card-bg text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Collection</label>
                  <select
                    value={targetCollectionId}
                    onChange={(e) => setTargetCollectionId(e.target.value)}
                    className="glass-select w-full h-11 px-4 rounded-xl text-sm focus:border-primary/50"
                  >
                    <option value="">Select a collection</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 h-11 rounded-xl border border-card-border/50 text-xs font-black uppercase tracking-widest hover:bg-foreground/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Tabs */}
        <div className="flex gap-4">
          {['Params', 'Auth', 'Headers', 'Body'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all relative ${activeTab === tab.toLowerCase() ? 'text-primary' : 'text-muted hover:text-foreground'
                }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {activeTab === 'params' && <ParamsTab params={params} setParams={setParams} />}
        {activeTab === 'auth' && <AuthTab auth={auth} setAuth={setAuth} />}
        {activeTab === 'headers' && <HeadersTab headers={headers} setHeaders={setHeaders} auth={auth} />}
        {activeTab === 'body' && <BodyTab body={body} setBody={setBody} method={method} />}
      </div>
    </div>
  );
}
