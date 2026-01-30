"use client";
import Link from "next/link";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";


export default function ForgotPassword() {
return (
<div className="min-h-screen flex items-center justify-center gap-20">
<AuthCard title="Reset Password">
<input type="email" placeholder="Enter your email" className="w-full p-2 mb-3 bg-gray-800 rounded" />
<button className="w-full bg-red-600 p-2 rounded">Send Reset Link</button>
<p className="text-sm mt-3"><Link href="/">Back to Login</Link></p>
</AuthCard>
<Astronaut />
</div>
);
}