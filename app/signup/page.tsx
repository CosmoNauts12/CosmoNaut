"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";
import ThemeToggle from "../components/ThemeToggle";
import { signUpWithEmail, logout, updateProfile } from "@/app/lib/firebase";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // No local redirect logic needed here as AuthProvider handles it globally

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signUpWithEmail(email, password);
      
      // Save the user's name to their Firebase profile
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
        console.log("SignUp: User profile updated with name:", name);
      }

      // No longer logging out. Take new users straight to onboarding.
      setSuccess("Account created successfully! Preparing your journey...");
      setTimeout(() => {
        router.push("/onboarding/loading");
      }, 1500);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError(err.message || "Failed to create account");
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
        <AuthCard className="max-w-3xl">
          <h1 className="text-3xl font-bold text-glass-title mb-2">Create account</h1>
          <p className="text-glass-subtitle mb-8">Get started with your free account</p>

          {error && (
            <div className="glass-error px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-xl mb-5 text-sm backdrop-blur-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm glass-label mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm glass-label mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm glass-label mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                  required
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm glass-label mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                  required
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary w-full py-3.5 rounded-xl font-semibold text-base mb-4 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-glass-muted mt-6">
            Already have an account?{' '}
            <Link href="/" className="font-semibold text-primary hover:text-secondary transition-colors">
              Log In
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