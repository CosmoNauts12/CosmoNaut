"use client";

import Link from "next/link";
import Astronaut from "./components/Astronaut";
import AuthCard from "./components/AuthCard";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-20 bg-black text-white">
      <AuthCard title="Welcome Back">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 bg-gray-800 rounded outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-3 bg-gray-800 rounded outline-none"
        />

        <button className="w-full bg-indigo-600 p-2 rounded mt-2 hover:bg-indigo-700">
          Sign In
        </button>

        <div className="flex justify-between text-sm mt-3">
          <Link href="/forgot-password" className="text-gray-400 hover:text-white">
            Forgot Password?
          </Link>

          <Link href="/signup" className="text-gray-400 hover:text-white">
            Sign Up
          </Link>
        </div>
      </AuthCard>

      <Astronaut />
    </div>
  );
}
