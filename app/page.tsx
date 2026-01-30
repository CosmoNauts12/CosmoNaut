"use client";

import Link from "next/link";
import Astronaut from "./components/Astronaut";
import AuthCard from "./components/AuthCard";

export default function SignIn() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">

      {/* Gradient Glow Blobs */}
      <div className="blob blob-pink"></div>
      <div className="blob blob-blue"></div>

      {/* Main Glass Panel */}
      <div className="glass flex items-center justify-between gap-20 p-16 rounded-3xl max-w-6xl w-full z-10">

        {/* Left Login Section */}
        <div className="flex flex-col">
          <AuthCard title="Welcome back">

            <label className="text-sm text-gray-300 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full p-3 mb-4 bg-black/40 border border-white/20 rounded-lg outline-none"
            />

            <label className="text-sm text-gray-300 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="Password 8-16 characters"
              className="w-full p-3 mb-4 bg-black/40 border border-white/20 rounded-lg outline-none"
            />

            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-400">Remember me</span>
              <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300">
                Forgot Password?
              </Link>
            </div>

            <button className="w-full bg-white text-black p-3 rounded-lg font-semibold hover:bg-gray-200">
              Sign in
            </button>

            <button className="w-full mt-3 bg-black/50 border border-white/20 p-3 rounded-lg hover:bg-black/70">
              Continue with Google
            </button>

            <p className="mt-4 text-sm text-gray-400">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-white hover:underline">
                Sign Up
              </Link>
            </p>

          </AuthCard>
        </div>

        {/* Right Astronaut Section */}
        <div className="hidden md:block">
          <Astronaut />
        </div>

      </div>
    </div>
  );
}
