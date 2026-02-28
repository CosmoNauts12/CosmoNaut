import { render, screen } from '@testing-library/react';
import Astronaut from '../Astronaut';
import { describe, it, expect } from 'vitest';

describe('Astronaut', () => {
    it('renders astronaut image', () => {
        render(<Astronaut />);
        const image = screen.getByRole('img', { name: /robot mascot/i });
        expect(image).toBeInTheDocument();
    });
});
