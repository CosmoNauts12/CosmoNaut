import { useState, useMemo } from "react";
import { CosmoResponse } from "./RequestEngine";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from "./ThemeContext";

/**
 * Custom Postman Dark Theme for Prism
 */
const postmanDark: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#D4D4D4',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    border: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    background: 'transparent',
  },
  'pre[class*="language-"]': {
    color: '#D4D4D4',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    background: 'transparent',
    margin: '0',
    padding: '0',
    overflow: 'visible',
  },
  comment: { color: '#6A9955' },
  prolog: { color: '#6A9955' },
  doctype: { color: '#6A9955' },
  cdata: { color: '#6A9955' },
  punctuation: { color: '#D4D4D4' },
  property: { color: '#9CDCFE' },
  tag: { color: '#569CD6' },
  boolean: { color: '#569CD6' },
  number: { color: '#B5CEA8' },
  constant: { color: '#4FC1FF' },
  symbol: { color: '#B5CEA8' },
  deleted: { color: '#CE9178' },
  selector: { color: '#D7BA7D' },
  'attr-name': { color: '#9CDCFE' },
  string: { color: '#CE9178' },
  char: { color: '#CE9178' },
  builtin: { color: '#CE9178' },
  inserted: { color: '#B5CEA8' },
  operator: { color: '#D4D4D4' },
  entity: { color: '#D4D4D4', cursor: 'help' },
  url: { color: '#D4D4D4', textDecoration: 'underline' },
  variable: { color: '#9CDCFE' },
  atrule: { color: '#C586C0' },
  'attr-value': { color: '#CE9178' },
  function: { color: '#DCDCAA' },
  keyword: { color: '#C586C0' },
  regex: { color: '#D16969' },
  important: { color: '#569CD6', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

/**
 * Custom Postman Light Theme for Prism
 */
const postmanLight: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#333333',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    border: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    background: 'transparent',
  },
  'pre[class*="language-"]': {
    color: '#333333',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    background: 'transparent',
    margin: '0',
    padding: '0',
    overflow: 'visible',
  },
  comment: { color: '#939393' },
  prolog: { color: '#939393' },
  doctype: { color: '#939393' },
  cdata: { color: '#939393' },
  punctuation: { color: '#333333' },
  property: { color: '#A65D03' },
  tag: { color: '#22863A' },
  boolean: { color: '#005CC5' },
  number: { color: '#22863A' },
  constant: { color: '#005CC5' },
  symbol: { color: '#22863A' },
  deleted: { color: '#D73A49' },
  selector: { color: '#6F42C1' },
  'attr-name': { color: '#6F42C1' },
  string: { color: '#0366D6' },
  char: { color: '#0366D6' },
  builtin: { color: '#0366D6' },
  inserted: { color: '#22863A' },
  operator: { color: '#D73A49' },
  entity: { color: '#333333', cursor: 'help' },
  url: { color: '#0366D6', textDecoration: 'underline' },
  variable: { color: '#E36209' },
  atrule: { color: '#D73A49' },
  'attr-value': { color: '#0366D6' },
  function: { color: '#6F42C1' },
  keyword: { color: '#D73A49' },
  regex: { color: '#032F62' },
  important: { color: '#005CC5', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

/**
 * Component for displaying HTTP response data.
 */
/**
 * Map of error types to user-friendly titles, descriptions, and icons.
 */
const ERROR_DETAILS = {
  DNS_ERROR: {
    title: "DNS Resolution Failed",
    desc: "The domain name could not be resolved. Please check the URL spelling or your DNS settings.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
        <path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
      </svg>
    )
  },
  TIMEOUT_ERROR: {
    title: "Mission Timed Out",
    desc: "The server took too long to respond. This might be due to a slow connection or a heavy server-side operation.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/80 mb-6">
        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M12 6c-3.31 0-6 2.69-6 6"></path>
      </svg>
    )
  },
  SSL_ERROR: {
    title: "Secure Connection Failed",
    desc: "There was a problem establishing a secure SSL/TLS connection. This could be an expired certificate or a protocol mismatch.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><path d="M12 16v-1"></path>
      </svg>
    )
  },
  NETWORK_ERROR: {
    title: "Connection Failed",
    desc: "Could not reach the server. Please check your internet connection or ensuring the server is running.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
        <path d="M1 1l22 22"></path><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><path d="M12 20h.01"></path>
      </svg>
    )
  },
  INVALID_URL: {
    title: "Invalid Protocol",
    desc: "The request terminal could not interpret the protocol. Ensure the URL starts with http:// or https://.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500/80 mb-6">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    )
  },
  UNKNOWN_ERROR: {
    title: "Unexpected Failure",
    desc: "An unknown anomaly occurred during request execution. Check the console for more details.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted mb-6">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    )
  }
};


export default function ResponsePanel({
  response,
  isExecuting
}: {
  response: CosmoResponse | null;
  isExecuting: boolean;
}) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"pretty" | "visualize">("pretty");
  const [format, setFormat] = useState<"json" | "xml" | "html" | "javascript" | "raw">("json");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formats = [
    { id: 'json', name: 'JSON', icon: <span className="text-[10px] w-4 font-bold">{ }</span> },
    { id: 'xml', name: 'XML', icon: <span className="text-[10px] w-4 font-bold">&lt;/&gt;</span> },
    { id: 'html', name: 'HTML', icon: <span className="text-[10px] w-4 font-bold">&lt;!&gt;</span> },
    { id: 'javascript', name: 'JavaScript', icon: <span className="text-[10px] w-4 font-bold">JS</span> },
    { id: 'raw', name: 'Raw', icon: <span className="text-[10px] w-4 font-bold">TXT</span> },
  ];

  const formattedBody = useMemo(() => {
    if (!response?.body) return "";

    // RAW: return the exact server response untouched
    if (format === "raw") {
      return response.body;
    }

    // For JSON, XML, HTML, JS: parse body and inject metadata
    const postmanToken = response.headers["postman-token"] || response.headers["Postman-Token"];
    const cookie = response.headers["cookie"] || response.headers["Cookie"] || response.headers["set-cookie"] || response.headers["Set-Cookie"];

    let bodyObj: Record<string, unknown> | null = null;
    try {
      bodyObj = JSON.parse(response.body);
    } catch {
      // Not JSON — return body as-is for all formats
      return response.body;
    }

    // Inject metadata headers into the parsed object
    if (bodyObj && typeof bodyObj === 'object') {
      if (!bodyObj.headers || typeof bodyObj.headers !== 'object') {
        bodyObj.headers = {};
      }
      const headers = bodyObj.headers as Record<string, unknown>;
      if (postmanToken) headers["postman-token"] = postmanToken;
      if (cookie) headers["cookie"] = cookie;
    }

    // JSON Tab: pretty-printed multiline
    if (format === "json") {
      return JSON.stringify(bodyObj, null, 2);
    }

    // HTML Tab: compact JSON with cookie value split at semicolons into real lines
    if (format === "html") {
      const compact = JSON.stringify(bodyObj);
      // Find "cookie":"..." and replace "; " with ";\n" to create real line breaks
      const cookieKey = '"cookie":"';
      const cookieIdx = compact.indexOf(cookieKey);
      if (cookieIdx !== -1) {
        const valueStart = cookieIdx + cookieKey.length;
        // Walk to find end of cookie string value (unescaped closing quote)
        let valueEnd = valueStart;
        while (valueEnd < compact.length) {
          if (compact[valueEnd] === '\\') { valueEnd += 2; continue; }
          if (compact[valueEnd] === '"') break;
          valueEnd++;
        }
        const before = compact.slice(0, valueStart);
        const cookieValue = compact.slice(valueStart, valueEnd).replace(/; /g, ';\n');
        const after = compact.slice(valueEnd);
        return before + cookieValue + after;
      }
      return compact;
    }

    // JavaScript Tab: JS object literal style with spaces around structural tokens
    if (format === "javascript") {
      const compact = JSON.stringify(bodyObj);
      let result = '';
      let inString = false;
      for (let i = 0; i < compact.length; i++) {
        const ch = compact[i];
        if (inString) {
          result += ch;
          if (ch === '\\' && i + 1 < compact.length) {
            result += compact[++i]; // safely skip escaped char (e.g. \", \\, \n)
          } else if (ch === '"') {
            inString = false;
          }
        } else {
          if (ch === '"') { inString = true; result += ch; }
          else if (ch === '{') result += '{ ';
          else if (ch === '}') result += ' }';
          else if (ch === ':') result += ': ';
          else if (ch === ',') result += ', ';
          else result += ch;
        }
      }
      return result;
    }

    // XML Tab: compact single-line (word-wrapped by the display)
    return JSON.stringify(bodyObj);
  }, [response, format]);

  if (isExecuting) {
    return (
      <div className="flex flex-col h-full bg-card-bg/5 backdrop-blur-xl border-t border-card-border items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analyzing Signal...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card-bg/5 backdrop-blur-xl border-t border-card-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse group">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:rotate-12 transition-transform duration-500"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
        </div>
        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground mb-3">Telemetry Synchronized</h4>
        <p className="text-[10px] text-muted font-bold tracking-wide max-w-xs leading-relaxed">
          The request terminal is active. Awaiting mission parameters to execute neural handshake.
        </p>
      </div>
    );
  }

  if (response.error) {
    const errorType = response.error.error_type;
    // Map backend CamelCase to frontend SCREAMING_SNAKE_CASE if needed, or normalize
    const normalizedType = errorType.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '') as keyof typeof ERROR_DETAILS;
    const details = ERROR_DETAILS[normalizedType] || ERROR_DETAILS.UNKNOWN_ERROR;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card-bg/5 backdrop-blur-xl border-t border-card-border overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
          {details.icon}
          <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground mb-3">{details.title}</h4>
          <p className="text-[11px] text-muted font-medium max-w-md leading-relaxed mb-8">{details.desc}</p>
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-left max-w-lg w-full">
            <p className="text-[10px] font-mono text-rose-500/80 break-all">{response.error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusLabel = (code: number) => {
    const labels: Record<number, string> = {
      200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Server Error'
    };
    return labels[code] || '';
  };

  return (
    <div className="flex flex-col h-full bg-card-bg/5 backdrop-blur-xl border-t border-card-border overflow-hidden">
      {/* Response Header */}
      <div className={`h-12 px-4 border-b border-card-border/50 flex items-center justify-between z-20 ${theme === 'dark' ? 'bg-black/20' : 'bg-white/40'} backdrop-blur-md`}>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pretty")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'pretty' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
            >
              Body
            </button>
            <button
              onClick={() => setActiveTab("visualize")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'visualize' ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground'}`}
            >
              Preview
            </button>
          </div>

          <div className="w-[1px] h-4 bg-muted/20 mx-2" />

          {/* Format Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-black uppercase tracking-widest text-foreground/80 transition-colors border border-transparent"
            >
              <span className="text-primary/70">{formats.find(f => f.id === format)?.icon}</span>
              <span>{formats.find(f => f.id === format)?.name}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className={`absolute top-full left-0 mt-1 w-36 rounded-xl border border-card-border shadow-2xl p-1 z-20 animate-in fade-in zoom-in-95 duration-100 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-white text-black'}`}>
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFormat(f.id as any);
                        setIsDropdownOpen(false);
                        setActiveTab("pretty");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${format === f.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-foreground/5 hover:text-foreground'}`}
                    >
                      <span className={format === f.id ? 'text-primary' : 'text-muted opacity-50'}>{f.icon}</span>
                      {f.name}
                      {format === f.id && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-muted uppercase tracking-tighter leading-none mb-1 opacity-70">Status</span>
              <span className={`text-[11px] font-black ${response.status >= 200 && response.status < 300 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {response.status} {getStatusLabel(response.status)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-muted uppercase tracking-tighter leading-none mb-1 opacity-70">Time</span>
              <span className="text-[11px] font-black text-emerald-500">{response.duration_ms} ms</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-muted uppercase tracking-tighter leading-none mb-1 opacity-70">Size</span>
              <span className="text-[11px] font-black text-emerald-500">
                {response.body.length < 1024
                  ? `${response.body.length} B`
                  : `${(response.body.length / 1024).toFixed(2)} KB`}
              </span>
            </div>
          </div>

          <div className="w-[1px] h-4 bg-muted/20" />

          <button className="flex items-center gap-2 group">
            <span className="text-[10px] font-black text-muted group-hover:text-primary uppercase tracking-[0.1em] transition-colors">Save</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary transition-colors"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          </button>

          <button className="p-1 hover:text-primary transition-colors opacity-60 hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 3 6 6-12 12H3v-6L15 3z"></path><path d="m9 7 8 8"></path></svg>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-hidden relative group/content">
        {activeTab === 'pretty' && (
          <div className={`h-full overflow-y-auto selection:bg-primary/30 ${theme === 'dark' ? 'bg-card-bg/5' : 'bg-white'}`}>
            {(format === 'xml' || format === 'html' || format === 'javascript' || format === 'raw') ? (
              /* Per-line row layout: each logical line gets its own number + content row */
              <div className="h-full overflow-y-auto" style={{
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
                fontSize: '13px',
                padding: '1.5rem 0',
              }}>
                {formattedBody.split('\n').map((line, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', minHeight: '1.6em' }}>
                    {/* Line number */}
                    <div style={{
                      minWidth: '3.5em',
                      paddingRight: '1em',
                      textAlign: 'right',
                      color: theme === 'dark' ? '#858585' : '#999999',
                      fontSize: '11px',
                      lineHeight: '1.6',
                      opacity: 0.6,
                      userSelect: 'none',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    {/* Line content — can word-wrap within this row */}
                    <pre style={{
                      margin: 0,
                      paddingRight: '1.5rem',
                      backgroundColor: 'transparent',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      lineHeight: '1.6',
                      flex: 1,
                      color: format === 'javascript'
                        ? (theme === 'dark' ? '#fbbf24' : '#2563eb')
                        : format === 'html'
                          ? (theme === 'dark' ? '#4ade80' : '#2563eb')
                          : format === 'xml'
                            ? (theme === 'dark' ? '#fb923c' : '#2563eb')
                            : undefined // raw — default text color
                    }}>
                      <code>{line}</code>
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <SyntaxHighlighter
                key={format}
                language={format}
                style={theme === 'dark' ? postmanDark : postmanLight}
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={true}
                lineNumberStyle={{
                  minWidth: '3.5em',
                  paddingRight: '1.5em',
                  color: theme === 'dark' ? '#858585' : '#999999',
                  textAlign: 'right',
                  userSelect: 'none',
                  fontSize: '11px',
                  opacity: 0.6
                }}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  backgroundColor: 'transparent',
                  fontSize: '13px',
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
                }}
              >
                {formattedBody}
              </SyntaxHighlighter>
            )}
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-card-bg/5 backdrop-blur-xl">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl group-hover:blur-3xl transition-all duration-500 rounded-full" />
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary relative z-10 group-hover:scale-110 transition-transform duration-500"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h4 className="text-[14px] font-black uppercase tracking-[0.3em] text-foreground mb-4">Neural Visualization Ready</h4>
            <p className="text-[11px] text-muted font-bold tracking-wide max-w-sm leading-relaxed mb-8">
              Visual telemetry rendering engine is online. Connect a data source to generate real-time interface projections.
            </p>
            <button className="px-8 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/20 transition-all duration-300">
              Initialize Handshake
            </button>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-8 flex gap-2 opacity-0 group-hover/content:opacity-100 transition-opacity duration-300 z-10">
          <button className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 text-muted hover:text-primary hover:border-primary/50 transition-all shadow-xl ${theme === 'dark' ? 'bg-black/40' : 'bg-white/80'}`} title="Copy to Clipboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 text-muted hover:text-primary hover:border-primary/50 transition-all shadow-xl ${theme === 'dark' ? 'bg-black/40' : 'bg-white/80'}`} title="Search in Response">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
    </div >
  );
}
