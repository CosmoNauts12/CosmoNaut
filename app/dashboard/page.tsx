"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob blob-pink" style={{ top: '10%', right: '20%' }} />
        <div className="blob blob-cyan" style={{ bottom: '20%', left: '5%' }} />
        <div className="blob blob-coral" style={{ top: '50%', right: '5%' }} />
        <div className="blob blob-purple" style={{ top: '5%', left: '30%' }} />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-8 relative z-10">
        <div className="glass-card p-10 rounded-3xl w-full max-w-lg text-center">
          {/* User Avatar */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome{user.displayName ? `, ${user.displayName}` : ""}!
          </h1>
          
          <p className="text-slate-500 mb-8">
            {user.email}
          </p>

          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl mb-8">
            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Successfully authenticated!</p>
            <p className="text-sm">Your Firebase authentication is working correctly.</p>
          </div>

          <button
            onClick={handleLogout}
            className="btn-primary w-full py-3.5 rounded-xl font-semibold text-base"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
