import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    browserLocalPersistence,
    setPersistence,
    updateProfile,
    User,
    signInWithCredential,
    GoogleAuthProvider
} from "firebase/auth";

/**
 * Firebase Configuration
 * Credential details for connecting to the Firebase project.
 * NOTE: These are public-facing keys, safe for client-side usage.
 */

const firebaseConfig = {
    apiKey: "AIzaSyDfRbTA2Qi3RYmXcJKZkpspOUqypcA5wgs",
    authDomain: "software-project-45fdc.firebaseapp.com",
    projectId: "software-project-45fdc",
    storageBucket: "software-project-45fdc.firebasestorage.app",
    messagingSenderId: "260320074179",
    appId: "1:260320074179:web:f04ee172b4ee5f903b4576",
    measurementId: "G-6Z4N9QP5RL"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Configure persistence explicitly
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error("Firebase persistence error:", err);
    });
}

/**
 * Log in a user with email and password.
 * @param email - User's email.
 * @param password - User's password.
 */
export const loginWithEmail = async (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

/**
 * Register a new user with email and password.
 * @param email - User's email.
 * @param password - User's password.
 */
export const signUpWithEmail = async (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

/**
 * Signs out the current user.
 */
export const logout = async () => signOut(auth);

/**
 * Send a password reset email to the specified address.
 * @param email - Recipient's email.
 */
export const resetPassword = async (email: string) =>
    sendPasswordResetEmail(auth, email);

export { app, auth, onAuthStateChanged, updateProfile, signInWithCredential, GoogleAuthProvider };
export type { User };

/**
 * Initiates Google Sign-In via Tauri backend (system browser).
 * Backend handles OAuth flow, token verification, and secure storage.
 * 
 * Frontend should listen for 'auth-success' or 'auth-error' events.
 */
export const signInWithGoogle = async (): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_google_auth');
    } else {
        throw new Error("Google Sign-In is only available in the desktop app");
    }
};

/**
 * Restores user session from OS keychain on app startup.
 * Returns user data if valid session exists, null otherwise.
 */
export const restoreSession = async (userId: string): Promise<any | null> => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const userData = await invoke('restore_session', { userId });
            return userData;
        } catch (e) {
            console.error('Session restore failed:', e);
            return null;
        }
    }
    return null;
};

/**
 * Logs out user by removing tokens from OS keychain.
 */
export const logoutTauri = async (userId: string): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('logout', { userId });
    }
};
