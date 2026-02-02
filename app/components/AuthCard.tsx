export default function AuthCard({ title, children }: any) {
  return (
    <div className="liquid-glass liquid-glass-shimmer soft-glow pulse-glow p-10 rounded-3xl w-[440px] relative z-10">
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-glass-title mb-6 tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
