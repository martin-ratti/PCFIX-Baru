// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileForm from '../EditProfileForm';
import { fetchApi } from '../../../../utils/api';
// Mock hooks
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
}));

vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(),
}));

describe('EditProfileForm', () => {
    const mockAddToast = vi.fn();
    const mockLogout = vi.fn();
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            user: { id: 1, nombre: 'Test', apellido: 'User', email: 'test@example.com' },
            token: 'fake-token',
            logout: mockLogout,
            login: mockLogin
        });
        (useToastStore as any).mockReturnValue((msg: string) => mockAddToast(msg));

        // Mock GET profile
        (fetchApi as any).mockResolvedValue({
            json: async () => ({
                success: true,
                data: { id: 1, nombre: 'Test', apellido: 'User', email: 'test@example.com' }
            })
        });
    });

    it('should render delete account button', async () => {
        render(<EditProfileForm userId="1" />);

        // Wait for profile load
        // Use regex to match text with emoji or partial text
        expect(await screen.findByText(/Eliminar cuenta/i)).toBeDefined();
    });

    it('should open confirm modal when delete button is clicked', async () => {
        render(<EditProfileForm userId="1" />);

        const deleteBtn = await screen.findByText(/Eliminar cuenta/i);
        fireEvent.click(deleteBtn);

        expect(await screen.findByText('¿Eliminar Cuenta?')).toBeDefined();
        expect(screen.getByText(/Esta acción es irreversible/i)).toBeDefined();
    });

    it('should call delete api when confirmed', async () => {
        render(<EditProfileForm userId="1" />);
        const deleteBtn = await screen.findByText(/Eliminar cuenta/i);

        // Open modal
        fireEvent.click(deleteBtn);

        // Mock DELETE response
        (fetchApi as any).mockResolvedValueOnce({
            json: async () => ({ success: true })
        });

        // Click confirm in modal
        const confirmBtn = await screen.findByText(/Sí, Eliminar/i);
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/auth/profile', { method: 'DELETE' });
            expect(mockLogout).toHaveBeenCalled();
        });
    });
});
