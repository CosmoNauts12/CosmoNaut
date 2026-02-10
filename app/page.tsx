"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Astronaut from "./components/Astronaut";
import AuthCard from "./components/AuthCard";
import { loginWithEmail } from "@/app/lib/firebase";
import ThemeToggle from "./components/ThemeToggle";

/**
 * The main landing and authentication page for CosmoNaut.
 * Provides a glassmorphic interface for user sign-in.
 */
export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // No local redirect logic needed here as AuthProvider handles it globally

  /**
   * Handles user login with email and password.
   * Leverages Firebase Auth via the utility function.
   * Sets loading state and handles errors.
   * 
   * @param e Form event
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      console.log("SignIn: Successful login, AuthProvider will handle routing");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="login-bg" />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center gap-4 px-4 md:px-8 relative z-10">
        {/* Login Card */}
        <AuthCard>
          <h1 className="text-3xl font-bold text-glass-title mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-glass-subtitle mb-8">
            Sign in to continue your journey
          </p>

          {error && (
            <div className="glass-error px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin}>
            {/* Email Field */}
            <div className="mb-5">
              <label className="block text-sm glass-label mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label className="block text-sm glass-label mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="glass-checkbox"
                />
                <span className="text-sm text-glass-muted">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium glass-link"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary w-full py-3.5 rounded-xl text-base mb-4 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-glass-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:text-secondary transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </AuthCard>

        {/* Astronaut Section - No container, bigger and closer */}
        <div className="hidden lg:block relative -ml-8">
          <Astronaut />
        </div>
      </div>
    </div>
  );
}
