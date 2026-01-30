"use client";
import Link from "next/link";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";


export default function SignUp() {
return (
<div className="min-h-screen flex items-center justify-center gap-20">
<AuthCard title="Create Account">
<input type="text" placeholder="Name" className="w-full p-2 mb-3 bg-gray-800 rounded" />
<input type="email" placeholder="Email" className="w-full p-2 mb-3 bg-gray-800 rounded" />
<input type="password" placeholder="Password" className="w-full p-2 mb-3 bg-gray-800 rounded" />
<button className="w-full bg-green-600 p-2 rounded">Sign Up</button>
<p className="text-sm mt-3">Already have an account? <Link href="/">Login</Link></p>
</AuthCard>
<Astronaut />
</div>
);
}