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
    User
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

// Auth helper functions (Email/Password only)

/**
 * Signs in an existing user with email and password.
 */
export const loginWithEmail = async (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

/**
 * Creates a new user account with email and password.
 */
export const signUpWithEmail = async (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

/**
 * Signs out the current user.
 */
export const logout = async () => signOut(auth);

/**
 * Sends a password reset email to the provided address.
 */
export const resetPassword = async (email: string) =>
    sendPasswordResetEmail(auth, email);

export { app, auth, onAuthStateChanged, updateProfile };
export type { User };
