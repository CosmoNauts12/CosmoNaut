import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResponsePanel from '../ResponsePanel';
import React from 'react';

describe('ResponsePanel', () => {
    it('renders awaiting message when no response is provided', () => {
        render(<ResponsePanel response={null} isExecuting={false} />);
        expect(screen.getByText(/Awaiting Data Pipeline/i)).toBeInTheDocument();
    });

    it('renders executing message when isExecuting is true', () => {
        render(<ResponsePanel response={null} isExecuting={true} />);
        expect(screen.getByText(/Analyzing Signal/i)).toBeInTheDocument();
    });
});
