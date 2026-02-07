import { useState, useEffect } from "react";
import { useSettings } from "./SettingsProvider";
import { executeRequest, CosmoResponse } from "./RequestEngine";

const methods = ["GET", "POST", "PUT", "DELETE"];

export interface ActiveRequest {
  id: string;
  name: string;
  method: string;
}

export interface KVItem {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthState {
  type: 'none' | 'bearer' | 'basic';
  bearerToken?: string;
  username?: string;
  password?: string;
}

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
  const [method, setMethod] = useState(activeRequest.method);
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [activeTab, setActiveTab] = useState("params");

  // Unified Request State
  const [params, setParams] = useState<KVItem[]>([{ key: '', value: '', enabled: true }]);
  const [auth, setAuth] = useState<AuthState>({ type: 'none' });
  const [headers, setHeaders] = useState<KVItem[]>([{ key: '', value: '', enabled: true }]);
  const [body, setBody] = useState("");

  useEffect(() => {
    setMethod(activeRequest.method);
    // Only update URL if it's one of the mock ones or empty
    if (activeRequest.name === 'Get All Users') {
       setUrl("https://jsonplaceholder.typicode.com/posts/1");
    }
  }, [activeRequest]);

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

  const handleSend = async () => {
    onExecuting(true);
    let targetUrl = cleanUrl(url);

    // 1. Normalize Params
    const activeParams = params.filter(p => p.enabled && p.key.trim());
    if (activeParams.length > 0) {
      const urlObj = new URL(targetUrl);
      activeParams.forEach(p => urlObj.searchParams.append(p.key, p.value));
      targetUrl = urlObj.toString();
    }

    // 2. Normalize Headers & Auth
    const finalHeaders: Record<string, string> = {};
    
    // User headers
    headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
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
    } catch (error: any) {
      alert(`Request Failed: ${error}`);
    } finally {
      onExecuting(false);
    }
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
              className={`h-11 px-4 rounded-xl border border-card-border/50 bg-card-bg font-black text-xs appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-all ${
                method === 'GET' ? 'text-emerald-500' : 
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

          <button 
            onClick={handleSend}
            className="h-11 px-8 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
          >
            Send
          </button>
        </div>

        {/* Request Tabs */}
        <div className="flex gap-4">
          {['Params', 'Auth', 'Headers', 'Body'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all relative ${
                activeTab === tab.toLowerCase() ? 'text-primary' : 'text-muted hover:text-foreground'
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
import { ParamsTab, AuthTab, HeadersTab, BodyTab } from "./RequestBuilderTabs";
