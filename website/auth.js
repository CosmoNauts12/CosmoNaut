// Firebase Authentication Module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration (same as desktop app)
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const signInBtn = document.getElementById('signInBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userEmail = document.getElementById('userEmail');
const signOutBtn = document.getElementById('signOutBtn');

// Sign in with Google
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log('User signed in:', user.email);
        updateUI(user);
    } catch (error) {
        console.error('Sign-in error:', error);
        alert('Failed to sign in. Please try again.');
    }
}

// Sign out
async function handleSignOut() {
    try {
        await signOut(auth);
        console.log('User signed out');
        updateUI(null);
    } catch (error) {
        console.error('Sign-out error:', error);
    }
}

// Update UI based on auth state
function updateUI(user) {
    if (user) {
        // User is signed in
        signInBtn.style.display = 'none';
        userMenu.style.display = 'flex';

        // Set user avatar (first letter of email)
        const initial = user.email.charAt(0).toUpperCase();
        userAvatar.textContent = initial;
        userAvatar.title = user.email;

        // Set user email
        userEmail.textContent = user.email;

        // Show welcome message (optional)
        console.log(`Welcome back, ${user.email}!`);
    } else {
        // User is signed out
        signInBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    updateUI(user);
});

// Event listeners
if (signInBtn) {
    signInBtn.addEventListener('click', signInWithGoogle);
}

if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
}

// Export for use in other scripts
export { auth, signInWithGoogle, handleSignOut };
