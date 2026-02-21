import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    })),
    useSearchParams: vi.fn(() => ({
        get: vi.fn(),
    })),
    usePathname: vi.fn(() => ''),
}));

// Mock Firebase Auth and Firestore
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    updateProfile: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    confirmPasswordReset: vi.fn(),
    verifyPasswordResetCode: vi.fn(),
    EmailAuthProvider: {
        credential: vi.fn(),
    },
    reauthenticateWithCredential: vi.fn(),
    updatePassword: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe function
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn(),
}));

// Mock ThemeContext
vi.mock('@/app/components/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
    })),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{ children } </div>
}));

// Mock app/lib/firebase to avoid initialization issues
vi.mock('@/app/lib/firebase', () => ({
    auth: {},
    db: {},
    loginWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    verifyCode: vi.fn(),
    confirmReset: vi.fn(),
    EmailAuthProvider: {
        credential: vi.fn(),
    },
    reauthenticateWithCredential: vi.fn(),
    updatePassword: vi.fn(),
}));
