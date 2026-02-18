import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User,
    signInWithRedirect
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDfRbTA2Qi3RYmXcJKZkpspOUqypcA5wgs",
    authDomain: "software-project-45fdc.firebaseapp.com",
    projectId: "software-project-45fdc",
    storageBucket: "software-project-45fdc.firebasestorage.app",
    messagingSenderId: "260320074179",
    appId: "1:260320074179:web:f04ee172b4ee5f903b4576",
    measurementId: "G-6Z4N9QP5RL"
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

// Auth helper functions
export const loginWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
    return signOut(auth);
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export { app, auth, analytics, onAuthStateChanged };
export type { User };
