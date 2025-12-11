import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PasswordStrengthMeter from '../PasswordStrengthMeter';
import React from 'react';

describe('PasswordStrengthMeter', () => {
    it('renders nothing when password is empty', () => {
        const { container } = render(<PasswordStrengthMeter password="" />);
        expect(screen.queryByText(/requisitos/i)).toBeNull();
    });

    it('shows very weak for short passwords', () => {
        // 1 requirement: digits or length < 8
        render(<PasswordStrengthMeter password="123" />);
        // 123 has digits (+1) but length < 8. Score = 1?
        // Logic: 
        // length>=8: No
        // Upper: No
        // Number: Yes (+1)
        // Special: No
        // Score = 1
        expect(screen.getByText('Débil')).toBeDefined();
    });

    it('shows good strength for complex password', () => {
        // Abc12345
        // Length >= 8: Yes (+1)
        // Upper: Yes (+1)
        // Number: Yes (+1)
        // Special: No
        // Total: 3 (Buena)
        render(<PasswordStrengthMeter password="Abc12345" />);
        expect(screen.getByText('Buena')).toBeDefined();
    });

    it('shows secure strength for very complex password', () => {
        // Abc12345!
        // Length >= 8: Yes
        // Upper: Yes
        // Number: Yes
        // Special: Yes
        // Total: 4 (Segura)
        render(<PasswordStrengthMeter password="Abc12345!" />);
        expect(screen.getByText('Segura')).toBeDefined();
    });
});
