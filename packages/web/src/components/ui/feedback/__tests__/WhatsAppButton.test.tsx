import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WhatsAppButton from '../WhatsAppButton';

describe('WhatsAppButton', () => {
    it('renders WhatsApp link', () => {
        render(<WhatsAppButton />);
        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
    });

    it('has correct WhatsApp URL with phone number', () => {
        render(<WhatsAppButton />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', expect.stringContaining('wa.me'));
        expect(link).toHaveAttribute('href', expect.stringContaining('543464513588'));
    });

    it('opens in new tab', () => {
        render(<WhatsAppButton />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has correct aria-label for accessibility', () => {
        render(<WhatsAppButton />);
        const link = screen.getByLabelText('Contactar por WhatsApp');
        expect(link).toBeInTheDocument();
    });

    it('has fixed positioning classes', () => {
        render(<WhatsAppButton />);
        const link = screen.getByRole('link');
        expect(link).toHaveClass('fixed');
        expect(link).toHaveClass('bottom-6');
        expect(link).toHaveClass('right-6');
    });
});
