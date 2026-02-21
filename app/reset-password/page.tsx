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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength states
    const [strength, setStrength] = useState(0);
    const [metCriteria, setMetCriteria] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    const checkStrength = (pass: string) => {
        const checks = {
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            lowercase: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass)
        };
        setMetCriteria(checks);
        const score = Object.values(checks).filter(Boolean).length;
        setStrength(score);
    };

    useEffect(() => {
        checkStrength(password);
    }, [password]);

    const getStrengthLabel = () => {
        if (strength === 0) return { label: "Empty", color: "bg-gray-500/20", text: "text-gray-500" };
        if (strength <= 2) return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
        if (strength <= 4) return { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" };
        return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
    };

    const [isPasswordFocused, setIsPasswordFocused] = useState(false);



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

        if (strength < 5) {
            setError("Please meet all password strength requirements.");
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
                        <label htmlFor="reset-new-password" className="block text-sm glass-label mb-2">New Password</label>
                        <div className="relative">
                            <input
                                id="reset-new-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                className="glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-base"

                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-glass-muted hover:text-primary transition-colors p-1"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password Strength Meter & Checklist */}
                        {(password.length > 0 || isPasswordFocused) && (
                            <div className="mt-3 space-y-3">

                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-glass-muted">Strength: <span className={getStrengthLabel().text}>{getStrengthLabel().label}</span></span>
                                    <span className="text-xs text-glass-muted">{strength}/5</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((idx) => (
                                        <div
                                            key={idx}
                                            className={`h-full flex-1 transition-all duration-300 ${idx <= strength ? getStrengthLabel().color : "bg-white/5"}`}
                                        />
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                    <div className={`flex items-center gap-2 text-[11px] ${metCriteria.length ? "text-emerald-500" : "text-glass-muted opacity-60"}`}>
                                        <div className={`w-1 h-1 rounded-full ${metCriteria.length ? "bg-emerald-500" : "bg-white/20"}`} />
                                        At least 8 characters
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] ${metCriteria.uppercase ? "text-emerald-500" : "text-glass-muted opacity-60"}`}>
                                        <div className={`w-1 h-1 rounded-full ${metCriteria.uppercase ? "bg-emerald-500" : "bg-white/20"}`} />
                                        Uppercase letter
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] ${metCriteria.lowercase ? "text-emerald-500" : "text-glass-muted opacity-60"}`}>
                                        <div className={`w-1 h-1 rounded-full ${metCriteria.lowercase ? "bg-emerald-500" : "bg-white/20"}`} />
                                        Lowercase letter
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] ${metCriteria.number ? "text-emerald-500" : "text-glass-muted opacity-60"}`}>
                                        <div className={`w-1 h-1 rounded-full ${metCriteria.number ? "bg-emerald-500" : "bg-white/20"}`} />
                                        Contains a number
                                    </div>
                                    <div className={`flex items-center gap-2 text-[11px] ${metCriteria.special ? "text-emerald-500" : "text-glass-muted opacity-60"}`}>
                                        <div className={`w-1 h-1 rounded-full ${metCriteria.special ? "bg-emerald-500" : "bg-white/20"}`} />
                                        Special character
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <label htmlFor="reset-confirm-password" className="block text-sm glass-label mb-2">Confirm New Password</label>
                        <div className="relative">
                            <input
                                id="reset-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-base"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-glass-muted hover:text-primary transition-colors p-1"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
