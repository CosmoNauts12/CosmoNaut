"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, onAuthStateChanged, logout as firebaseLogout, User } from "@/app/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import LoadingSplash from "./LoadingSplash";

/**
 * Structure of the authentication context provided to the application.
 */
interface AuthContextType {
  /** The currently authenticated user object, or null if signed out. */
  user: User | null;
  /** Boolean indicating if the initial session check is in progress. */
  loading: boolean;
  /** Function to sign out the current user and redirect to landing. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 * 
 * @returns {AuthContextType} The auth context values
 * @throws {Error} If used outside of an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Global authentication provider.
 * Manages Firebase session state, auto-redirects for authenticated users,
 * and displays a global loading splash during transitions.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Effect to handle loading state resolution after navigation.
   */
  useEffect(() => {
    if (loading && user && pathname !== "/" && pathname !== "/signup") {
      console.log("AuthProvider: Path changed, clearing loading state");
      setLoading(false);
    }
  }, [pathname, user, loading]);

  /**
   * Effect to initialize Firebase auth listener and handle session-based redirection.
   */
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

  /**
   * Signs out the user via Firebase and redirects to the landing page.
   */
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
