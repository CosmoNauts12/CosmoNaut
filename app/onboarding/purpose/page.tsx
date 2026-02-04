"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PurposePage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return;

    setLoading(true);
    // Simulate saving
    setTimeout(() => {
      localStorage.setItem('onboarding_purpose', purpose);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-8">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(2,6,23,1)_100%)]" />
        <div className="blob blob-purple animate-slow-pulse" style={{ top: '20%', left: '30%' }} />
        <div className="blob blob-cyan animate-slow-pulse" style={{ bottom: '20%', right: '30%', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-3xl relative z-10 text-center">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold mb-6 tracking-tight gemini-gradient-text">
            How can we help you today?
          </h1>
          <p className="text-slate-400 text-xl">
            Tell us about the purpose of your visit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="gemini-input-container p-1 mb-8">
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-40 bg-transparent text-white p-6 rounded-[23px] text-lg focus:outline-none resize-none placeholder:text-slate-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !purpose.trim()}
            className="glass-btn-primary px-10 py-4 rounded-2xl text-lg font-semibold disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? "Saving your preferences..." : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
