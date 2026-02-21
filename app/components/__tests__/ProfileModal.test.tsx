import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfileModal from '../ProfileModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettings } from '../SettingsProvider';
import { useAuth } from '../AuthProvider';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from '@/app/lib/firebase';

// Mock Providers and Firebase
vi.mock('../SettingsProvider', () => ({
    useSettings: vi.fn(),
}));

vi.mock('../AuthProvider', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/app/lib/firebase', () => ({
    EmailAuthProvider: {
        credential: vi.fn(),
    },
    reauthenticateWithCredential: vi.fn(),
    updatePassword: vi.fn(),
}));

describe('ProfileModal Component', () => {
    const mockSetProfileOpen = vi.fn();
    const mockUpdateSettings = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSettings).mockReturnValue({
            isProfileOpen: true,
            setProfileOpen: mockSetProfileOpen,
            settings: { status: 'Testing' },
            updateSettings: mockUpdateSettings,
        } as any);
        vi.mocked(useAuth).mockReturnValue({
            user: { displayName: 'Tester', email: 'test@example.com' },
        } as any);
    });

    it('renders profile info correctly', () => {
        render(<ProfileModal />);
        expect(screen.getByText('Tester')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('What are you working on?')).toHaveValue('Testing');
    });

    it('switches to change password view', () => {
        render(<ProfileModal />);
        const changePassBtn = screen.getAllByRole('button', { name: /Change Password/i })[0];

        fireEvent.click(changePassBtn);

        expect(screen.getByPlaceholderText('Current Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('validates password strength in the modal', async () => {
        render(<ProfileModal />);
        fireEvent.click(screen.getAllByRole('button', { name: /Change Password/i })[0]);

        const newPassInput = screen.getByPlaceholderText('New Password');
        fireEvent.focus(newPassInput);

        // Initial state
        expect(screen.getByText(/Security:/i)).toBeInTheDocument();

        // Type weak
        fireEvent.change(newPassInput, { target: { value: '123' } });
        expect(await screen.findByText(/Weak/i)).toBeInTheDocument();

        // Check labels
        expect(screen.getByText(/8\+ chars/i)).toBeInTheDocument();
        expect(screen.getByText(/Lowercase/i)).toBeInTheDocument();

        // Type strong
        fireEvent.change(newPassInput, { target: { value: 'Strong!123' } });
        expect(await screen.findByText(/Strong/i)).toBeInTheDocument();
    });

    it('successfully updates password after re-authentication', async () => {
        (reauthenticateWithCredential as any).mockResolvedValue({});
        (updatePassword as any).mockResolvedValue({});

        render(<ProfileModal />);
        fireEvent.click(screen.getAllByRole('button', { name: /Change Password/i })[0]);

        fireEvent.change(screen.getByPlaceholderText('Current Password'), { target: { value: 'old-pass' } });
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Strong!123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Strong!123' } });

        const submitBtn = screen.getByRole('button', { name: 'Confirm Update' });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(EmailAuthProvider.credential).toHaveBeenCalledWith('test@example.com', 'old-pass');
            expect(reauthenticateWithCredential).toHaveBeenCalled();
            expect(updatePassword).toHaveBeenCalledWith(expect.anything(), 'Strong!123');
            expect(screen.getByText(/Password updated successfully!/i)).toBeInTheDocument();
        });
    });

    it('handles incorrect current password error', async () => {
        const error = new Error('Incorrect password');
        (error as any).code = 'auth/wrong-password';
        (reauthenticateWithCredential as any).mockRejectedValue(error);

        render(<ProfileModal />);
        fireEvent.click(screen.getAllByRole('button', { name: /Change Password/i })[0]);

        fireEvent.change(screen.getByPlaceholderText('Current Password'), { target: { value: 'wrong-pass' } });
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Strong!123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'Strong!123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Confirm Update' }));

        await waitFor(() => {
            expect(screen.getByText(/Current password is incorrect/i)).toBeInTheDocument();
        });
    });

    it('blocks submission if new password is not strong', async () => {
        render(<ProfileModal />);
        fireEvent.click(screen.getAllByRole('button', { name: /Change Password/i })[0]);

        const newPassInput = screen.getByPlaceholderText('New Password');
        const confirmInput = screen.getByPlaceholderText('Confirm New Password');
        const submitBtn = screen.getByRole('button', { name: 'Confirm Update' });

        fireEvent.change(screen.getByPlaceholderText('Current Password'), { target: { value: 'old-pass' } });
        fireEvent.change(newPassInput, { target: { value: 'weak' } });
        fireEvent.change(confirmInput, { target: { value: 'weak' } });

        // Wait for strength to reflect
        expect(await screen.findByText(/Weak/i)).toBeInTheDocument();

        fireEvent.click(submitBtn);

        expect(await screen.findByText(/New password must meet all strength requirements/i)).toBeInTheDocument();
        expect(updatePassword).not.toHaveBeenCalled();
    });
});
