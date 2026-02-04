"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSplash from "../../components/LoadingSplash";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/onboarding/role");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob blob-purple animate-slow-pulse" style={{ top: '20%', left: '20%' }} />
        <div className="blob blob-cyan animate-slow-pulse" style={{ bottom: '20%', right: '20%', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <LoadingSplash />
      </div>
    </div>
  );
}
