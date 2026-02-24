import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PasswordStrengthMeter from '../PasswordStrengthMeter';


describe('PasswordStrengthMeter', () => {
    it('renders nothing when password is empty', () => {
        const {} = render(<PasswordStrengthMeter password="" />);
        expect(screen.queryByText(/requisitos/i)).toBeNull();
    });

    it('shows very weak for short passwords', () => {
        
        render(<PasswordStrengthMeter password="123" />);
        
        
        
        
        
        
        
        expect(screen.getByText('Débil')).toBeDefined();
    });

    it('shows good strength for complex password', () => {
        
        
        
        
        
        
        render(<PasswordStrengthMeter password="Abc12345" />);
        expect(screen.getByText('Buena')).toBeDefined();
    });

    it('shows secure strength for very complex password', () => {
        
        
        
        
        
        
        render(<PasswordStrengthMeter password="Abc12345!" />);
        expect(screen.getByText('Segura')).toBeDefined();
    });
});
