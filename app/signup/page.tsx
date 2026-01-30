"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";
import { signUpWithEmail, loginWithGoogle } from "@/app/lib/firebase";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      router.push("/dashboard");
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
      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob blob-pink" style={{ top: '10%', right: '20%' }} />
        <div className="blob blob-cyan" style={{ bottom: '20%', left: '5%' }} />
        <div className="blob blob-coral" style={{ top: '50%', right: '5%' }} />
        <div className="blob blob-purple" style={{ top: '5%', left: '30%' }} />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center gap-16 px-8 relative z-10">
        <AuthCard>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create account</h1>
          <p className="text-slate-500 mb-8">Get started with your free account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            {/* Name Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input w-full px-4 py-3 rounded-xl text-base"
                required
              />
            </div>

            {/* Email Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full px-4 py-3 rounded-xl text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full px-4 py-3 rounded-xl text-base"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input w-full px-4 py-3 rounded-xl text-base"
                required
              />
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-base mb-4 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Google Button */}
          <button 
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="btn-secondary w-full py-3.5 rounded-xl font-medium text-base flex items-center justify-center gap-3 mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="text-center text-slate-600">
            Already have an account?{' '}
            <Link href="/" className="font-semibold text-slate-800 hover:text-indigo-600">
              Log In
            </Link>
          </p>
        </AuthCard>

        {/* Astronaut Section */}
        <div className="astronaut-frame rounded-3xl p-6 hidden lg:block">
          <Astronaut />
        </div>
      </div>
    </div>
  );
}