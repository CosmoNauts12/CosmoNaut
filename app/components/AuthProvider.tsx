"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, onAuthStateChanged, logout as firebaseLogout, User, signInWithGoogle, restoreSession, logoutTauri, signInWithCredential, GoogleAuthProvider } from "@/app/lib/firebase";
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
  /** Function to initiate Google Sign-In via Tauri backend */
  googleSignIn: () => Promise<void>;
  /** Function to initiate a demo session */
  demoSignIn: () => Promise<void>;
  /** Boolean indicating if the current session is a demo */
  isDemo: boolean;
  /** Error message from authentication attempts */
  authError: string | null;
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
  const [isDemo, setIsDemo] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
      
      const isDemoSession = localStorage.getItem("is_demo") === "true";
      if (isDemoSession) {
        console.log("AuthProvider: Demo session active");
        setUser({
          uid: "demo-user",
          email: "explorer@cosmonaut.local",
          displayName: "Demo Explorer",
          photoURL: null,
        } as User);
        setIsDemo(true);
        setLoading(false);
        if (window.location.pathname === "/" || window.location.pathname === "/signup") {
          router.push("/dashboard");
        }
        return;
      }

      setUser(u);
      setIsDemo(false);

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
   * Effect to listen for Tauri auth events (Google Sign-In)
   */
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      let unlistenSuccess: (() => void) | null = null;
      let unlistenError: (() => void) | null = null;

      (async () => {
        const { listen } = await import('@tauri-apps/api/event');

        // Listen for successful authentication
        unlistenSuccess = await listen('auth-success', async (event: any) => {
          console.log('AuthProvider: Google auth success', event.payload);
          const userData = event.payload;
          
          try {
            if (userData.google_id_token) {
              console.log('AuthProvider: Signing in with Google credential for persistence');
              const credential = GoogleAuthProvider.credential(userData.google_id_token);
              await signInWithCredential(auth, credential);
              // onAuthStateChanged will handle the rest (setting user, loading, routing)
            } else {
              console.warn('AuthProvider: No Google ID token received, falling back to non-persistent session');
              // Create a User-like object from the payload
              const mockUser = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.name || null,
                photoURL: userData.picture || null,
              } as User;

              setUser(mockUser);
              setAuthError(null);
              setLoading(false);

              // Route based on onboarding status
              const hasCompletedOnboarding = localStorage.getItem("onboarding_complete") === "true";
              const target = hasCompletedOnboarding ? "/dashboard" : "/onboarding/loading";
              router.push(target);
            }
          } catch (error: any) {
            console.error('AuthProvider: Failed to sign in with credential', error);
            setAuthError(error.message || 'Failed to complete authentication');
            setLoading(false);
          }
        });

        // Listen for authentication errors
        unlistenError = await listen('auth-error', (event: any) => {
          console.error('AuthProvider: Google auth error', event.payload);
          setAuthError(event.payload.message || 'Authentication failed');
          setLoading(false);
        });
      })();

      return () => {
        if (unlistenSuccess) unlistenSuccess();
        if (unlistenError) unlistenError();
      };
    }
  }, [router]);

  /**
   * Signs out the user via Firebase and redirects to the landing page.
   */
  const logout = async () => {
    localStorage.removeItem("is_demo");
    setIsDemo(false);
    
    // If Tauri app, also clear keychain
    if (user && typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      try {
        await logoutTauri(user.uid);
      } catch (e) {
        console.error('Failed to clear Tauri tokens:', e);
      }
    }
    
    await firebaseLogout();
    setUser(null);
    router.push("/");
  };

  /**
   * Initiates Google Sign-In via Tauri backend
   */
  const googleSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Success will be handled by event listener
    } catch (error: any) {
      setAuthError(error.message || 'Failed to start Google Sign-In');
      setLoading(false);
    }
  };

  /**
   * Initiates a demo session
   */
  const demoSignIn = async () => {
    setLoading(true);
    localStorage.setItem("is_demo", "true");
    setIsDemo(true);
    setUser({
      uid: "demo-user",
      email: "explorer@cosmonaut.local",
      displayName: "Demo Explorer",
      photoURL: null,
    } as User);
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, googleSignIn, demoSignIn, isDemo, authError }}>
      {loading ? <LoadingSplash /> : children}
    </AuthContext.Provider>
  );
}
