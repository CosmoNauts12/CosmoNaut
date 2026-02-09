import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../ThemeContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useTheme hook
vi.mock('../ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
    const mockToggleTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and allows toggling theme', () => {
        (useTheme as any).mockReturnValue({
            theme: 'light',
            toggleTheme: mockToggleTheme,
        });

        render(<ThemeToggle />);
        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
});
