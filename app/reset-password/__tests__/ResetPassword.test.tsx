import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from '../page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Firebase functions
vi.mock('@/app/lib/firebase', () => ({
    verifyCode: vi.fn(),
    confirmReset: vi.fn(),
}));

describe('ResetPassword Page', () => {
    const mockPush = vi.fn();
    const mockGet = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
        vi.mocked(useSearchParams).mockReturnValue({ get: mockGet } as any);
    });

    it('shows loading state while verifying code', () => {
        mockGet.mockReturnValue('valid-code');
        render(<ResetPassword />);
        expect(screen.getByText(/Verifying reset code/i)).toBeInTheDocument();
    });

    it('toggles password visibility in the reset form', async () => {
        const { verifyCode } = await import('@/app/lib/firebase');
        (verifyCode as any).mockResolvedValue('test@example.com');
        mockGet.mockReturnValue('valid-code');

        render(<ResetPassword />);

        // Wait for verification to finish
        await waitFor(() => expect(screen.queryByText(/Verifying reset code/i)).not.toBeInTheDocument());

        const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
        const toggleButtons = screen.getAllByRole('button', { name: /Show password/i });
        const passToggle = toggleButtons[0];

        expect(passwordInput).toHaveAttribute('type', 'password');
        fireEvent.click(passToggle);
        expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('shows strength meter on password focus', async () => {
        const { verifyCode } = await import('@/app/lib/firebase');
        (verifyCode as any).mockResolvedValue('test@example.com');
        mockGet.mockReturnValue('valid-code');

        render(<ResetPassword />);
        await waitFor(() => expect(screen.queryByText(/Verifying reset code/i)).not.toBeInTheDocument());

        const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

        expect(screen.queryByText(/Strength:/i)).not.toBeInTheDocument();

        fireEvent.focus(passwordInput);
        expect(screen.getByText(/Strength:/i)).toBeInTheDocument();
    });

    it('blocks reset if requirements are not met', async () => {
        const { verifyCode, confirmReset } = await import('@/app/lib/firebase');
        (verifyCode as any).mockResolvedValue('test@example.com');
        mockGet.mockReturnValue('valid-code');

        render(<ResetPassword />);
        await waitFor(() => expect(screen.queryByText(/Verifying reset code/i)).not.toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        const passwordInput = inputs[0];
        const confirmInput = inputs[1];
        const submitButton = screen.getByRole('button', { name: 'Update Password' });

        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.change(confirmInput, { target: { value: 'weak' } });

        // Wait for strength to update
        expect(await screen.findAllByText(/Weak/i)).not.toBeNull();

        fireEvent.click(submitButton);

        expect(await screen.findByText(/Please meet all password strength requirements/i)).toBeInTheDocument();
        expect(confirmReset).not.toHaveBeenCalled();
    });
});
