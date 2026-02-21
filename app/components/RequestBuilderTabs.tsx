import React from 'react';
import { KVItem, AuthState } from '@/app/lib/collections';

/**
 * Helper to update a Key-Value list by index.
 * Automatically appends a new empty row when the last entry is edited.
 * @param list - The current Key-Value pair array.
 * @param index - Index of the item being modified.
 * @param updates - Partial object containing field updates.
 */
const updateKV = (list: KVItem[], index: number, updates: Partial<KVItem>) => {
  const newList = [...list];
  newList[index] = { ...newList[index], ...updates };
  // Add empty row if last one is edited
  if (index === newList.length - 1 && (updates.key || updates.value)) {
    newList.push({ key: '', value: '', enabled: true });
  }
  return newList;
};

/**
 * Helper to delete a Key-Value item from a list.
 * Ensures at least one empty entry always remains.
 * @param list - The current Key-Value pair array.
 * @param index - Index of the item to remove.
 */
const deleteKV = (list: KVItem[], index: number) => {
  if (list.length <= 1) return [{ key: '', value: '', enabled: true }];
  return list.filter((_, i) => i !== index);
};

/**
 * Component for managing URL query parameters.
 * Provides a dynamic grid for editing key-value pairs.
 */
export function ParamsTab({ params, setParams, readOnly }: { params: KVItem[], setParams: (p: KVItem[]) => void, readOnly?: boolean }) {
  return (
    <div className="w-full space-y-2 p-2">
      <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted/50 mb-2">
        <span></span>
        <span>Key</span>
        <span>Value</span>
        <span></span>
      </div>
      {params.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 items-center group">
          <input
            type="checkbox"
            checked={item.enabled}
            disabled={readOnly}
            onChange={(e) => setParams(updateKV(params, idx, { enabled: e.target.checked }))}
            className="w-3 h-3 rounded bg-card-bg border-card-border accent-primary"
          />
          <input
            placeholder="Key"
            value={item.key}
            disabled={readOnly}
            onChange={(e) => setParams(updateKV(params, idx, { key: e.target.value }))}
            className={`bg-transparent border-b border-card-border/30 px-2 py-1 text-xs focus:border-primary/50 outline-none transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <input
            placeholder="Value"
            value={item.value}
            disabled={readOnly}
            onChange={(e) => setParams(updateKV(params, idx, { value: e.target.value }))}
            className={`bg-transparent border-b border-card-border/30 px-2 py-1 text-xs focus:border-primary/50 outline-none transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {(!readOnly && idx !== params.length - 1) && (
            <button
              onClick={() => setParams(deleteKV(params, idx))}
              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-110 transition-all text-sm"
            >
              ×
            </button>
          )}
          {(readOnly || idx === params.length - 1) && <span />}
        </div>
      ))}
    </div>
  );
}

/**
 * AuthTab Component
 * 
 * Handles authentication settings for the request.
 * - Supports 'Bearer Token' and 'Basic Auth'.
 * - Updates the auth state which feeds into generated headers.
 */
export function AuthTab({ auth, setAuth, readOnly }: { auth: AuthState, setAuth: (a: AuthState) => void, readOnly?: boolean }) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Auth Type</label>
        <select
          value={auth.type}
          disabled={readOnly}
          onChange={(e) => setAuth({ ...auth, type: e.target.value as any })}
          className={`w-full h-10 px-4 rounded-xl border border-card-border/50 bg-card-bg text-xs font-bold focus:border-primary/50 outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">Token</label>
          <input
            type="password"
            placeholder="Enter Bearer Token"
            value={auth.bearerToken || ''}
            disabled={readOnly}
            onChange={(e) => setAuth({ ...auth, bearerToken: e.target.value })}
            className={`w-full h-10 px-4 rounded-xl border border-card-border/50 bg-card-bg text-xs focus:border-primary/50 outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Username</label>
            <input
              placeholder="Username"
              value={auth.username || ''}
              disabled={readOnly}
              onChange={(e) => setAuth({ ...auth, username: e.target.value })}
              className={`w-full h-10 px-4 rounded-xl border border-card-border/50 bg-card-bg text-xs focus:border-primary/50 outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={auth.password || ''}
              disabled={readOnly}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              className={`w-full h-10 px-4 rounded-xl border border-card-border/50 bg-card-bg text-xs focus:border-primary/50 outline-none ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      )}

      <p className="text-[9px] text-muted italic text-center">Authorization headers will be automatically generated upon sending.</p>
    </div>
  );
}

/**
 * HeadersTab Component
 * 
 * Renders a key-value editor for HTTP headers.
 * - Displays auto-generated Auth headers (read-only).
 * - Allows custom header management.
 */
export function HeadersTab({ headers, setHeaders, auth, readOnly }: { headers: KVItem[], setHeaders: (h: KVItem[]) => void, auth: AuthState, readOnly?: boolean }) {
  return (
    <div className="w-full space-y-2 p-2">
      <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted/50 mb-2">
        <span></span>
        <span>Key</span>
        <span>Value</span>
        <span></span>
      </div>

      {/* Auth Generated Headers (Read-only) */}
      {auth.type !== 'none' && (
        <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 items-center opacity-50 italic">
          <input type="checkbox" checked readOnly className="w-3 h-3 rounded bg-card-bg border-card-border" />
          <span className="text-xs px-2">Authorization</span>
          <span className="text-xs px-2 truncate">
            {auth.type === 'bearer' ? `Bearer ${auth.bearerToken ? '••••••••' : ''}` : `Basic ${auth.username ? '••••••••' : ''}`}
          </span>
          <span></span>
        </div>
      )}

      {headers.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[30px_1fr_1fr_40px] gap-2 items-center group">
          <input
            type="checkbox"
            checked={item.enabled}
            disabled={readOnly}
            onChange={(e) => setHeaders(updateKV(headers, idx, { enabled: e.target.checked }))}
            className="w-3 h-3 rounded bg-card-bg border-card-border accent-primary"
          />
          <input
            placeholder="Key"
            value={item.key}
            disabled={readOnly}
            onChange={(e) => setHeaders(updateKV(headers, idx, { key: e.target.value }))}
            className={`bg-transparent border-b border-card-border/30 px-2 py-1 text-xs focus:border-primary/50 outline-none transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <input
            placeholder="Value"
            value={item.value}
            disabled={readOnly}
            onChange={(e) => setHeaders(updateKV(headers, idx, { value: e.target.value }))}
            className={`bg-transparent border-b border-card-border/30 px-2 py-1 text-xs focus:border-primary/50 outline-none transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {(!readOnly && idx !== headers.length - 1) && (
            <button
              onClick={() => setHeaders(deleteKV(headers, idx))}
              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-110 transition-all text-sm"
            >
              ×
            </button>
          )}
          {(readOnly || idx === headers.length - 1) && <span />}
        </div>
      ))}
    </div>
  );
}

/**
 * BodyTab Component
 * 
 * Renders a JSON editor for the request body.
 * - Only active for non-GET requests.
 * - Includes a "Beautify" button to format JSON.
 */
export function BodyTab({ body, setBody, method, readOnly }: { body: string, setBody: (b: string) => void, method: string, readOnly?: boolean }) {
  if (method === 'GET') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">GET Requests do not support body payloads</p>
      </div>
    );
  }

  /**
   * Attempts to parse and re-stringify the body to format it.
   * Prompts the user on error.
   */
  const handleBeautify = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      alert("Invalid JSON payload");
    }
  };

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-between items-center px-2 mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">JSON (raw)</span>
        <button
          onClick={handleBeautify}
          className="text-[9px] font-black uppercase tracking-widest text-primary hover:brightness-110 transition-all"
        >
          Beautify
        </button>
      </div>
      <textarea
        value={body}
        disabled={readOnly}
        onChange={(e) => setBody(e.target.value)}
        placeholder='{ "key": "value" }'
        className={`flex-1 w-full p-4 bg-black/10 rounded-2xl border border-card-border/30 text-xs font-mono focus:border-primary/50 outline-none resize-none scrollbar-hide ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
