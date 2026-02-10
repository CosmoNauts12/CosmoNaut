/**
 * A glassmorphic wrapper component for authentication forms.
 * Features liquid-glass aesthetics, inner glow gradients, and subtle animations.
 * 
 * @param title - Optional header title for the card.
 * @param children - Form content or other React elements.
 * @param className - Additional layout classes, defaults to max-width 440px.
 */
export default function AuthCard({ title, children, className = "max-w-[440px]" }: any) {
  return (
    <div className={`liquid-glass liquid-glass-shimmer soft-glow pulse-glow p-6 md:p-10 rounded-3xl w-full ${className} relative z-10`}>
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-primary/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {title && (
          <h2 className="text-3xl font-bold text-glass-title mb-6 tracking-tight">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
