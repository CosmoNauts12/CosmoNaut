"use client";

/**
 * Global loading screen component with a themed "space" aesthetic.
 * Features nested animated rings, a pulsing core, and a radial gradient background.
 * Used during authentication state resolution and app initialization.
 */
export default function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {/* Background with theme support */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary-glow)_0%,_transparent_70%)] opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 active:opacity-10 pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-32 h-32 mb-8">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-[spin_3s_linear_infinite]" />
          {/* Middle glowing ring */}
          <div className="absolute inset-4 rounded-full border-4 border-secondary/20 border-b-secondary animate-[spin_2s_linear_infinite_reverse]" />
          {/* Inner floating core */}
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_var(--primary-glow)] animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight animate-pulse transition-all">
          CosmoNaut
        </h2>
        <p className="text-slate-400 font-medium">
          Preparing your journey...
        </p>
      </div>
    </div>
  );
}
