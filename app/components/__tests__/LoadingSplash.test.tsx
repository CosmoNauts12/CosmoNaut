import { render, screen } from '@testing-library/react';
import LoadingSplash from '../LoadingSplash';
import { describe, it, expect } from 'vitest';

describe('LoadingSplash', () => {
    it('renders loading text and brand name', () => {
        render(<LoadingSplash />);
        expect(screen.getByText('CosmoNaut')).toBeInTheDocument();
        expect(screen.getByText('Preparing your journey...')).toBeInTheDocument();
    });
});
