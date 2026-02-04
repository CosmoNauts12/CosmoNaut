"use client";

import { useRouter } from "next/navigation";
import AuthCard from "../../components/AuthCard";

const roles = [
  { id: 'backend', title: 'Backend Professional', icon: '⚡' },
  { id: 'frontend', title: 'Frontend Professional', icon: '🎨' },
  { id: 'fullstack', title: 'Full Stack Developer', icon: '🚀' },
  { id: 'student', title: 'Student/Educator', icon: '🎓' },
  { id: 'teacher', title: 'Teacher/Mentor', icon: '👨‍🏫' },
];

export default function RoleSelection() {
  const router = useRouter();

  const handleRoleSelect = (roleIdValue: string) => {
    // Optionally save to local storage or state
    localStorage.setItem('user_role', roleIdValue);
    router.push("/onboarding/purpose");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob blob-indigo opacity-20" style={{ top: '10%', right: '10%' }} />
        <div className="blob blob-purple opacity-20" style={{ bottom: '10%', left: '10%' }} />
      </div>

      <div className="min-h-screen flex items-center justify-center px-8 relative z-10">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Tell us about yourself
            </h1>
            <p className="text-slate-400 text-lg">
              We'll tailor your experience based on your background.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {roles.map((role, index) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="onboarding-card p-8 rounded-3xl text-left"
                style={{ animationDelay: `${0.1 * (index + 3)}s` }}
              >
                <div className="text-4xl mb-6">{role.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-slate-500 text-sm">
                  Click to select this path
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
