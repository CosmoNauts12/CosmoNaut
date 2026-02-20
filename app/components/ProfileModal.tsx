"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "./SettingsProvider";
import { useAuth } from "./AuthProvider";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "@/app/lib/firebase";

/**
 * Profile Modal Component
 */
export default function ProfileModal() {
  const { isProfileOpen, setProfileOpen, settings, updateSettings } = useSettings();
  const { user } = useAuth();

  // --- Change Password States ---
  const [view, setView] = useState<'profile' | 'change-password'>('profile');
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isNewFocused, setIsNewFocused] = useState(false);

  // Strength logic
  const [strength, setStrength] = useState(0);
  const [metCriteria, setMetCriteria] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false
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
    setStrength(Object.values(checks).filter(Boolean).length);
  };

  useEffect(() => {
    checkStrength(newPassword);
  }, [newPassword]);

  const getStrengthLabel = () => {
    if (strength === 0) return { label: "Empty", color: "bg-gray-500/20", text: "text-gray-500" };
    if (strength <= 2) return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
    if (strength <= 4) return { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (strength < 5) {
      setError("New password must meet all strength requirements.");
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Transition back after delay
      setTimeout(() => {
        setView('profile');
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err.code === 'auth/wrong-password') {
        setError("Current password is incorrect.");
      } else {
        setError(err.message || "Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFields = () => {
    setView('profile');
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");
  };


  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setProfileOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg liquid-glass rounded-[2rem] border border-card-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">User Profile</h3>
            <button
              onClick={() => setProfileOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-card-bg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-2xl font-black text-foreground mb-1">{user?.displayName || "Explorer"}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-bold text-primary border border-primary/20">PRO USER</span>
                <p className="text-xs text-muted font-mono">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Current Status</label>
              <input
                type="text"
                value={settings.status || ""}
                onChange={(e) => updateSettings({ status: e.target.value })}
                placeholder="What are you working on?"
                autoFocus
                className="w-full bg-black/10 border border-card-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted/30"
              />
              <p className="text-[10px] text-muted font-bold opacity-60">Visible to your team members.</p>
            </div>

            <div className="h-px bg-card-border/50 my-2" />

            {/* View Switcher: Profile vs Change Password */}
            {view === 'profile' ? (
              <div className="pt-2">
                <button
                  onClick={() => setView('change-password')}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-foreground transition-all shadow-sm flex items-center justify-center gap-2 group"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-foreground transition-colors"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Change Password
                </button>
              </div>
            ) : (
              <div className="pt-2 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Update</p>
                  <button onClick={resetFields} className="text-[10px] font-bold text-muted hover:text-foreground transition-colors">Cancel</button>
                </div>

                {error && <div className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg mb-4">{error}</div>}
                {success && <div className="text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-2 rounded-lg mb-4">{success}</div>}

                <form onSubmit={handlePasswordChange} className="space-y-3">
                  {/* Current Password */}
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full bg-black/20 border border-card-border/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/30"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3 text-muted/50 hover:text-muted transition-colors">
                      {showCurrent ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setIsNewFocused(true)}
                      onBlur={() => setIsNewFocused(false)}
                      required
                      className="w-full bg-black/20 border border-card-border/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/30"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-muted/50 hover:text-muted transition-colors">
                      {showNew ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                    </button>
                  </div>

                  {/* Strength Meter Proactive UI */}
                  {(newPassword.length > 0 || isNewFocused) && (
                    <div className="px-1 py-1 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-muted uppercase">Security: <span className={getStrengthLabel().text}>{getStrengthLabel().label}</span></span>
                        <span className="text-[9px] text-muted">{strength}/5</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <div key={idx} className={`h-full flex-1 transition-all duration-300 ${idx <= strength ? getStrengthLabel().color : "bg-white/5"}`} />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 px-1">
                        {[
                          { id: 'length', label: '8+ chars' },
                          { id: 'uppercase', label: 'Uppercase' },
                          { id: 'lowercase', label: 'Lowercase' },
                          { id: 'number', label: 'Number' },
                          { id: 'special', label: 'Symbol' }
                        ].map(item => (
                          <div key={item.id} className={`flex items-center gap-1.5 text-[9px] font-bold transition-opacity ${metCriteria[item.id as keyof typeof metCriteria] ? "text-emerald-400" : "text-muted opacity-40"}`}>
                            <div className={`w-1 h-1 rounded-full ${metCriteria[item.id as keyof typeof metCriteria] ? "bg-emerald-400" : "bg-white/20"}`} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="w-full bg-black/20 border border-card-border/30 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted/30"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-muted/50 hover:text-muted transition-colors">
                      {showConfirm ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 mt-2"
                  >
                    {loading ? "Updating..." : "Confirm Update"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
