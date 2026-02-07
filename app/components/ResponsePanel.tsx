"use client";

import { useState } from "react";

export default function ResponsePanel() {
  const [activeTab, setActiveTab] = useState("pretty");
  const [visualMode, setVisualMode] = useState("graph");

  const mockData = {
    status: 200,
    time: "124 ms",
    size: "1.2 KB",
    body: {
      id: 1,
      name: "Adith",
      role: "Commander",
      missions: [
        { id: "M1", target: "Moon", status: "Active", progress: 85 },
        { id: "M2", target: "Mars", status: "Planning", progress: 30 },
        { id: "M3", target: "Venus", status: "Standby", progress: 0 }
      ]
    }
  };

  return (
    <div className="flex flex-col h-full bg-card-bg/10 backdrop-blur-md border-t border-card-border overflow-hidden">
      {/* Response Header */}
      <div className="h-10 px-4 border-b border-card-border/50 flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("pretty")}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pretty' ? 'text-primary' : 'text-muted'}`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab("visualize")}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visualize' ? 'text-primary' : 'text-muted'}`}
          >
            Visualize
          </button>
        </div>

        <div className="flex gap-4 text-[10px] font-bold">
          <span className="text-emerald-500">Status: <span className="text-foreground">{mockData.status} OK</span></span>
          <span className="text-muted">Time: <span className="text-foreground">{mockData.time}</span></span>
          <span className="text-muted">Size: <span className="text-foreground">{mockData.size}</span></span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {activeTab === 'pretty' && (
          <div className="liquid-glass p-6 rounded-2xl border-card-border/50 shadow-inner overflow-x-auto">
            <pre className="text-primary/90">
              {JSON.stringify(mockData.body, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'visualize' && (
          <div className="h-full flex flex-col gap-6">
            <div className="flex gap-2">
              {['Graph', 'Table'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setVisualMode(mode.toLowerCase())}
                  className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter transition-all ${
                    visualMode === mode.toLowerCase() 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                      : 'border-card-border text-muted hover:border-muted'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {visualMode === 'graph' && (
              <div className="flex-1 flex items-end gap-6 px-4 pt-4 pb-8 min-h-[200px]">
                {mockData.body.missions.map(m => (
                  <div key={m.id} className="flex-1 flex flex-col items-center gap-3">
                    <div 
                      className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-t-lg shadow-lg relative group transition-all duration-500 hover:brightness-125" 
                      style={{ height: `${m.progress}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.progress}%
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-tighter truncate w-full text-center">{m.target}</span>
                  </div>
                ))}
              </div>
            )}

            {visualMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-card-border">
                <table className="w-full text-left">
                  <thead className="bg-foreground/5 text-[10px] uppercase font-black tracking-widest text-muted">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {mockData.body.missions.map(m => (
                      <tr key={m.id} className="text-[10px] font-bold hover:bg-foreground/5 transition-colors">
                        <td className="p-3 text-muted">{m.id}</td>
                        <td className="p-3 text-foreground">{m.target}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full ring-1 ring-inset ${
                            m.status === 'Active' ? 'text-emerald-500 ring-emerald-500/20 bg-emerald-500/10' :
                            m.status === 'Planning' ? 'text-amber-500 ring-amber-500/20 bg-amber-500/10' :
                            'text-muted ring-muted/20 bg-foreground/5'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-foreground">{m.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
