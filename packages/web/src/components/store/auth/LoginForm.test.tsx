import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
});

describe('LoginForm', () => {
    const mockLogin = vi.fn();
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue(mockLogin);
        // Fix for selector usage
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
        global.fetch = vi.fn();
    });

    it('renders login form correctly', () => {
        render(<LoginForm />);
        expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        render(<LoginForm />);
        const submitBtn = screen.getByRole('button', { name: /entrar/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Correo inválido')).toBeInTheDocument();
            expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
        });
    });

    it('handles successful login and redirects', async () => {
        (global.fetch as any).mockResolvedValue({
            json: async () => ({
                success: true,
                data: {
                    token: 'fake-token',
                    user: { id: 1, nombre: 'Test User', role: 'USER' }
                }
            })
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'password123' } });

        const submitBtn = screen.getByRole('button', { name: /entrar/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('fake-token', expect.objectContaining({ id: 1 }));
            expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Bienvenido'), 'success');
        });

        await new Promise(r => setTimeout(r, 150));
        expect(window.location.href).toBe('/');
    });

    it('handles login error', async () => {
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: false, error: 'Credenciales inválidas' })
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Credenciales inválidas', 'error');
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });
});
