"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";
import ThemeToggle from "../components/ThemeToggle";
import { signUpWithEmail, loginWithGoogle, logout, getGoogleRedirectResult, isTauri, auth, onAuthStateChanged } from "@/app/lib/firebase";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("SignUp page mounted. isTauri:", isTauri);

    // 1. Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth State Changed (signup): User detected!", user.email);
        router.push("/dashboard");
      } else {
        console.log("Auth State Changed (signup): No user detected.");
      }
    });

    // 2. Check for redirect result
    const checkRedirect = async () => {
      try {
        console.log("Checking for Google redirect result (signup)...");
        const result = await getGoogleRedirectResult();
        if (result?.user) {
          console.log("Redirect Result (signup): User detected!", result.user.email);
          router.push("/dashboard");
        } else {
          console.log("Redirect Result (signup): No result found.");
        }
      } catch (err: any) {
        console.error("Redirect Result (signup): Error caught:", err);
      }
    };

    checkRedirect();
    return () => unsubscribe();
  }, [router]);

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
      await signUpWithEmail(email, password);
      // Sign out immediately so they have to log in manually
      await logout();
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
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

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
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

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="glass-divider flex-1" />
            <span className="text-sm text-glass-muted">or continue with</span>
            <div className="glass-divider flex-1" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="glass-btn-secondary w-full py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-3 mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="text-center text-glass-muted">
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