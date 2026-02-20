import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUp from '../page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

// Mock AuthProvider and useAuth
vi.mock('../../components/AuthProvider', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock Firebase functions
vi.mock('@/app/lib/firebase', () => ({
    signUpWithEmail: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
}));

describe('SignUp Page', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            loading: false,
            googleSignIn: vi.fn(),
            logout: vi.fn(),
            demoSignIn: vi.fn(),
            isDemo: false,
            authError: null,
        } as any);
    });

    it('toggles password visibility when eye icon is clicked', async () => {
        render(<SignUp />);
        const passwordInput = screen.getByPlaceholderText('Password (min 8 chars)');
        const toggleButton = screen.getAllByLabelText(/Show password/i)[0];

        expect(passwordInput).toHaveAttribute('type', 'password');

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        fireEvent.click(screen.getAllByLabelText(/Hide password/i)[0]);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('updates strength meter and checklist as user types', async () => {
        render(<SignUp />);
        const passwordInput = screen.getByPlaceholderText('Password (min 8 chars)');

        // Initially Empty
        expect(screen.queryByText(/Strength:/i)).not.toBeInTheDocument();

        // Focus to show requirements
        fireEvent.focus(passwordInput);
        expect(screen.getByText(/Strength:/i)).toBeInTheDocument();
        expect(screen.getByText(/Empty/i)).toBeInTheDocument();

        // Type weak password
        fireEvent.change(passwordInput, { target: { value: 'abc' } });
        expect(await screen.findAllByText(/Weak/i)).toHaveLength(1);
        expect(screen.getByText(/Lowercase letter/i)).toHaveClass('text-emerald-500');
        expect(screen.getByText(/Uppercase letter/i)).toHaveClass('text-glass-muted');

        // Type strong password
        fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
        expect(await screen.findAllByText(/Strong/i)).toHaveLength(1);
        expect(screen.getByText(/At least 8 characters/i)).toHaveClass('text-emerald-500');
        expect(screen.getByText(/Uppercase letter/i)).toHaveClass('text-emerald-500');
        expect(screen.getByText(/Contains a number/i)).toHaveClass('text-emerald-500');
        expect(screen.getByText(/Special character/i)).toHaveClass('text-emerald-500');
    });

    it('prevents form submission if password is not strong', async () => {
        const { signUpWithEmail } = await import('@/app/lib/firebase');
        render(<SignUp />);

        const emailInput = screen.getByPlaceholderText(/Email Address/i);
        const passwordInput = screen.getByPlaceholderText(/Password \(min 8 chars\)/i);
        const nameInput = screen.getByPlaceholderText(/Your full name/i);
        const submitButton = screen.getByRole('button', { name: /Sign up/i });

        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'weak' } });

        // Wait for strength to update
        expect(await screen.findAllByText(/Weak/i)).not.toBeNull();

        fireEvent.click(submitButton);

        // Should show error and not call signUpWithEmail
        expect(await screen.findByText(/Please meet all password strength requirements/i)).toBeInTheDocument();
        expect(signUpWithEmail).not.toHaveBeenCalled();
    });
});
