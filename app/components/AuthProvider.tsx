"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, onAuthStateChanged, logout as firebaseLogout, User } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: Initializing...");

    // Simplified: Just listen for auth state changes for email/password sessions.
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("AuthProvider: Session state recovered:", u?.email || "none");
      setUser(u);
      setLoading(false);

      // Auto-redirect to dashboard if user is logged in and on the landing page or signup page
      if (u && (window.location.pathname === "/" || window.location.pathname === "/signup")) {
        console.log("AuthProvider: Active session found on landing/signup, routing to dashboard");
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
