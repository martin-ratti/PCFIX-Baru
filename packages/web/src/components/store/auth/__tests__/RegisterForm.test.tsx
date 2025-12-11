import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../RegisterForm';

// Mocks


describe('RegisterForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('renders register form correctly', () => {
        render(<RegisterForm />);
        expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
        // Just check for one input to verify render
        expect(screen.getByPlaceholderText('Juan')).toBeInTheDocument();
    });

    it('shows validation error for password mismatch', async () => {
        render(<RegisterForm />);

        // Use getAll because both inputs might have same placeholder
        const passwords = screen.getAllByPlaceholderText('******');
        // Assume order: Password, Confirm
        if (passwords.length >= 2) {
            fireEvent.change(passwords[0], { target: { value: 'password123' } });
            fireEvent.change(passwords[1], { target: { value: 'password456' } });
        }

        const submitBtn = screen.getByRole('button', { name: /crear cuenta/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
        });
    });

    it('handles successful registration', async () => {
        // Mock window.location
        const originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = { href: '' };

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true })
        });

        render(<RegisterForm />);

        fireEvent.change(screen.getByPlaceholderText('Juan'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Pérez'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('juan@ejemplo.com'), { target: { value: 'john@doe.com' } });

        const passwords = screen.getAllByPlaceholderText('******');
        fireEvent.change(passwords[0], { target: { value: 'password123' } });
        fireEvent.change(passwords[1], { target: { value: 'password123' } });

        const submitBtn = screen.getByRole('button', { name: /crear cuenta/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/exito|éxito/i)).toBeInTheDocument();
        });

        await new Promise(r => setTimeout(r, 2100)); // wait for redirect
        expect(window.location.href).toBe('/auth/login');

        // Restore
        (window as any).location = originalLocation;
    }, 5000);
});
