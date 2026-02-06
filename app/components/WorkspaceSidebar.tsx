"use client";

import { useState } from "react";

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

export default function WorkspaceSidebar() {
  const [activeActivity, setActiveActivity] = useState('collections');

  return (
    <div className="flex h-full border-r border-card-border bg-card-bg/50 backdrop-blur-xl transition-colors duration-500">
      {/* Activity Bar (Narrow Left) */}
      <div className="w-14 flex flex-col items-center py-4 border-r border-card-border/50 gap-2">
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
      <div className="w-64 flex flex-col p-4 bg-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
            {activeActivity}
          </h2>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors text-xs font-medium">
              Import
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder={`Search ${activeActivity}...`}
            className="w-full bg-foreground/5 border border-card-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Content Stubs */}
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {activeActivity === 'collections' && (
            <div className="p-8 text-center bg-foreground/5 rounded-2xl border border-dashed border-card-border">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Create a collection</h3>
              <p className="text-xs text-muted mb-4">Group related requests and set common variables.</p>
              <button className="text-xs font-bold text-primary hover:underline">Create Collection</button>
            </div>
          )}
          {activeActivity !== 'collections' && (
            <div className="text-center py-10">
              <p className="text-xs text-muted italic">No {activeActivity} found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
