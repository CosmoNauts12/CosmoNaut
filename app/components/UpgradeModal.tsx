import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const { logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-8 relative liquid-glass animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 shadow-glow overflow-hidden">
            <img src="/logo.svg" alt="Robot Mascot Logo" className="w-12 h-12" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            You&apos;ve reached the demo limit
          </h2>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            You have successfully tested the engine! Sign up for a free account to unlock unlimited requests, collections, dynamic environments, and all of CosmoNaut&apos;s premium features.
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={async () => {
                onClose();
                await logout();
                router.push("/signup");
              }}
              className="glass-btn-primary w-full py-3 rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all"
            >
              Create Free Account
            </button>
            <button
              onClick={async () => {
                onClose();
                await logout();
                router.push("/");
              }}
              className="w-full py-3 rounded-xl font-semibold border border-card-border hover:bg-card-bg text-foreground transition-colors active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
