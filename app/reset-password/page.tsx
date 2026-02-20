"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Astronaut from "../components/Astronaut";
import AuthCard from "../components/AuthCard";
import ThemeToggle from "../components/ThemeToggle";
import { verifyCode, confirmReset } from "@/app/lib/firebase";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const oobCode = searchParams.get("oobCode");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        async function verifyCodeStatus() {
            if (!oobCode) {
                setError("Invalid or missing reset code.");
                setVerifying(false);
                return;
            }

            try {
                await verifyCode(oobCode);
                setVerifying(false);
            } catch (err: any) {
                setError("The password reset link is invalid or has expired.");
                setVerifying(false);
            }
        }

        verifyCodeStatus();
    }, [oobCode]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            if (!oobCode) throw new Error("Missing reset code");
            await confirmReset(oobCode, password);
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-glass-subtitle">Verifying reset code...</p>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-glass-title mb-2">New Password</h1>
            <p className="text-glass-subtitle mb-8">Enter your new secure password below</p>

            {error && (
                <div className="glass-error px-4 py-3 rounded-xl mb-5 text-sm">
                    {error}
                </div>
            )}

            {success ? (
                <div className="text-center">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-6 py-6 rounded-xl backdrop-blur-md">
                        <p className="font-semibold text-xl mb-1">Password changed</p>
                        <p className="text-sm opacity-80">
                            You can now sign in with your new password.
                        </p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleReset}>
                    <div className="mb-4">
                        <label className="block text-sm glass-label mb-2">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                            required
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm glass-label mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3.5 rounded-xl text-base"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!error}
                        className="glass-btn-primary w-full py-3.5 rounded-xl font-semibold text-base mb-6 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            )}
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="login-bg" />

            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            <div className="min-h-screen flex items-center justify-center gap-4 px-8 relative z-10">
                <AuthCard>
                    <Suspense fallback={<p className="text-glass-subtitle">Loading...</p>}>
                        <ResetPasswordForm />
                    </Suspense>
                </AuthCard>

                <div className="hidden lg:block relative -ml-8">
                    <Astronaut />
                </div>
            </div>
        </div>
    );
}
