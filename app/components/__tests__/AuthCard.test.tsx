import { render, screen } from '@testing-library/react';
import AuthCard from '../AuthCard';
import { describe, it, expect } from 'vitest';

describe('AuthCard', () => {
    it('renders title and children correctly', () => {
        const testTitle = "Test Title";
        const testContent = "Test Content";

        render(
            <AuthCard title={testTitle}>
                <div>{testContent}</div>
            </AuthCard>
        );

        expect(screen.getByRole('heading', { level: 2, name: testTitle })).toBeInTheDocument();
        expect(screen.getByText(testContent)).toBeInTheDocument();
    });
});
