"use client";

export default function LoadingSplash() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-32 h-32 mb-8">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-[spin_3s_linear_infinite]" />
        {/* Middle glowing ring */}
        <div className="absolute inset-4 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-[spin_2s_linear_infinite_reverse]" />
        {/* Inner floating core */}
        <div className="absolute inset-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight animate-fade-in-up">
        Preparing your experience
      </h2>
      <p className="text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        Wait a beat while we get things ready...
      </p>
    </div>
  );
}
