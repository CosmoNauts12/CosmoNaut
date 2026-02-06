"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, onAuthStateChanged, logout as firebaseLogout, User } from "@/app/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import LoadingSplash from "./LoadingSplash";

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
  const pathname = usePathname();

  // Listen for the pathname change to clear loading state after redirect
  useEffect(() => {
    if (loading && user && pathname !== "/" && pathname !== "/signup") {
      console.log("AuthProvider: Path changed, clearing loading state");
      setLoading(false);
    }
  }, [pathname, user, loading]);

  useEffect(() => {
    console.log("AuthProvider: Initializing...");

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("AuthProvider: Session state recovered:", u?.email || "none");
      setUser(u);

      const isSigningUp = localStorage.getItem("is_signing_up") === "true";
      if (isSigningUp) {
        console.log("AuthProvider: User is in signup process, skipping auto-redirect");
        setLoading(false);
        return;
      }

      const path = window.location.pathname;
      // If we found a user and they are on the login or signup page, redirect
      if (u && (path === "/" || path === "/signup")) {
        const hasCompletedOnboarding = localStorage.getItem("onboarding_complete") === "true";
        const target = hasCompletedOnboarding ? "/dashboard" : "/onboarding/loading";
        
        console.log(`AuthProvider: Active session found. Routing to ${target}`);
        router.push(target);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {loading ? <LoadingSplash /> : children}
    </AuthContext.Provider>
  );
}
