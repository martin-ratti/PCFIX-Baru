// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordForm from '../ResetPasswordForm';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
});

describe('ResetPasswordForm', () => {
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset location
        mockLocation.href = '';

        // Mock toast store
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });

        // Mock fetch
        global.fetch = vi.fn();
    });

    it('renders form correctly', () => {
        render(<ResetPasswordForm token="fake-token" />);
        expect(screen.getByText('Restablecer Contraseña')).toBeDefined();
        expect(screen.getByPlaceholderText('Min. 6 caracteres')).toBeDefined();
        expect(screen.getByPlaceholderText('Repite la contraseña')).toBeDefined();
    });

    it('validates password mismatch', async () => {
        render(<ResetPasswordForm token="fake-token" />);

        fireEvent.change(screen.getByPlaceholderText('Min. 6 caracteres'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password456' } });

        const submitBtn = screen.getByText('Confirmar Cambio');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Las contraseñas no coinciden')).toBeDefined();
        });
    });

    it('submits successfully and redirects', async () => {
        render(<ResetPasswordForm token="fake-token" />);

        // Mock successful API response
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true })
        });

        fireEvent.change(screen.getByPlaceholderText('Min. 6 caracteres'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });

        const submitBtn = screen.getByText('Confirmar Cambio');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/reset-password'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ token: 'fake-token', newPassword: 'password123' })
                })
            );
            expect(mockAddToast).toHaveBeenCalledWith('Contraseña actualizada con éxito', 'success');
        });

        // Check redirect (simulated via timeout)
        await new Promise(r => setTimeout(r, 2100));
        expect(window.location.href).toBe('/auth/login');
    });

    it('handles api error', async () => {
        render(<ResetPasswordForm token="fake-token" />);

        // Mock error API response
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: false, error: 'Token inválido' })
        });

        fireEvent.change(screen.getByPlaceholderText('Min. 6 caracteres'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), { target: { value: 'password123' } });

        const submitBtn = screen.getByText('Confirmar Cambio');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Token inválido', 'error');
        });
    });
});
