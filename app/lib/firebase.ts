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
 * Sign out the current user.
 */
export const logout = async () => signOut(auth);

/**
 * Send a password reset email to the specified address.
 * @param email - Recipient's email.
 */
export const resetPassword = async (email: string) =>
    sendPasswordResetEmail(auth, email);

export { app, auth, onAuthStateChanged, updateProfile };
export type { User };
