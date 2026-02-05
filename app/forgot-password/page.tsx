"use client";

import { useState } from "react";
import Link from "next/link";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";
import ThemeToggle from "../components/ThemeToggle";
import { resetPassword } from "@/app/lib/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Failed to send reset email");
      }
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
        <AuthCard>
          <h1 className="text-3xl font-bold text-glass-title mb-2">Reset password</h1>
          <p className="text-glass-subtitle mb-8">Enter your email to receive a reset link</p>

          {error && (
            <div className="glass-error px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-4 rounded-xl mb-6 backdrop-blur-md">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Reset link sent!</p>
                <p className="text-sm mt-1">Check your email for instructions to reset your password.</p>
              </div>
              <Link href="/" className="glass-btn-primary inline-block px-8 py-3.5 rounded-xl font-semibold w-full">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              {/* Email Field */}
              <div className="mb-6">
                <label className="block text-sm glass-label mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="glass-btn-primary w-full py-3.5 rounded-xl font-semibold text-base mb-6 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* Back to Login */}
              <p className="text-center text-glass-muted">
                Remember your password?{' '}
                <Link href="/" className="font-semibold text-primary hover:text-secondary transition-colors">
                  Log In
                </Link>
              </p>
            </form>
          )}
        </AuthCard>

        {/* Astronaut Section - No container, bigger and closer */}
        <div className="hidden lg:block relative -ml-8">
          <Astronaut />
        </div>
      </div>
    </div>
  );
}