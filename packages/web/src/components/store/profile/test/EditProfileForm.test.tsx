
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditProfileForm from '../EditProfileForm';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';
import * as apiUtils from '../../../../utils/api';

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(),
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(), // Default mock, will be overridden
    API_URL: 'http://localhost:3000/api',
}));

// Mock ConfirmModal since it's used
vi.mock('../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm, onCancel, title }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <h1>{title}</h1>
            <button onClick={onConfirm}>Confirm</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ) : null
}));

// Mock ForgotPasswordModal
vi.mock('../../auth/ForgotPasswordModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? (
        <div data-testid="forgot-password-modal">
            <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

describe('EditProfileForm', () => {
    const mockAuthStore = {
        user: { id: '1', nombre: 'Test', apellido: 'User' },
        token: 'token123',
        login: vi.fn(),
        logout: vi.fn(),
    };

    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue(mockAuthStore);
        (useToastStore as any).mockReturnValue((s: any) => s.addToast || mockAddToast); // Simplified mock selector
        // Better mock for store selectors using functional updates
        /* 
           Usually useToastStore(s => s.addToast) 
           So we mock implementation to return mockAddToast
        */
        (useToastStore as any).mockImplementation((selector: any) => {
            if (selector) return selector({ addToast: mockAddToast });
            return { addToast: mockAddToast };
        });


        // Mock API GET profile success
        (apiUtils.fetchApi as any).mockResolvedValue({
            json: async () => ({
                success: true,
                data: {
                    id: 1,
                    nombre: 'Test',
                    apellido: 'User',
                    email: 'test@example.com',
                    role: 'USER',
                    createdAt: new Date().toISOString(),
                    googleId: null
                }
            })
        });
    });

    it('renders profile data correctly', async () => {
        render(<EditProfileForm userId="1" />);

        // Should show loading initially
        expect(screen.getByText('Cargando tu perfil...')).toBeInTheDocument();

        // Wait for data load
        await waitFor(() => {
            expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument();
        });

        // Check fields populated
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('validates password fields before submission', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const currentPassInput = screen.getByPlaceholderText('********');
        const newPassInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
        const updateBtn = screen.getByText('Actualizar Contraseña');

        // Empty attempt
        fireEvent.click(updateBtn);
        // Toast is called, but we don't have a screen alert for toast usually. 
        // We verify mockAddToast calls.
        expect(mockAddToast).toHaveBeenCalledWith('Completa ambos campos', 'error');

        // Short password
        fireEvent.change(currentPassInput, { target: { value: 'password123' } });
        fireEvent.change(newPassInput, { target: { value: '123' } });
        fireEvent.click(updateBtn);
        expect(mockAddToast).toHaveBeenCalledWith('La nueva contraseña debe tener 6 caracteres', 'error');
    });

    it('calls change-password api on valid submission', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const currentPassInput = screen.getByPlaceholderText('********');
        const newPassInput = screen.getByPlaceholderText('Mínimo 6 caracteres');
        const updateBtn = screen.getByText('Actualizar Contraseña');

        fireEvent.change(currentPassInput, { target: { value: 'oldPassword' } });
        fireEvent.change(newPassInput, { target: { value: 'newPassword123' } });

        // Mock API response for change password
        // We need to handle sequential calls to fetchApi (GET then POST)
        // or ensure fetchApi mock handles generic calls.
        // It's easier to verify call arguments.

        (apiUtils.fetchApi as any).mockResolvedValueOnce({ // Override for next call (which is the submit)
            json: async () => ({ success: true })
        });

        // Wait! The component makes a GET on mount.
        // So mockResolvedValueOnce would apply to the GET if set before render.
        // But we are setting it here, AFTER render and after GET should have finished.
        // However, to be safe, let's just make it return success for any call or check path.

        // Refine mock implementation
        (apiUtils.fetchApi as any).mockImplementation(async (path: string, options: any) => {
            if (path.includes('/users/1') && !options) { // GET
                return {
                    json: async () => ({
                        success: true,
                        data: { id: 1, nombre: 'Test', apellido: 'User', email: 'test@example.com' }
                    })
                };
            }
            if (path === '/auth/change-password' && options?.method === 'POST') {
                return {
                    json: async () => ({ success: true })
                };
            }
            return { json: async () => ({ success: false }) };
        });


        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(apiUtils.fetchApi).toHaveBeenCalledWith('/auth/change-password', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ currentPassword: 'oldPassword', newPassword: 'newPassword123' })
            }));
        });

        expect(mockAddToast).toHaveBeenCalledWith('Contraseña cambiada exitosamente', 'success');
        expect(currentPassInput).toHaveValue('');
        expect(newPassInput).toHaveValue('');
    });

    it('opens forgot password modal', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const forgotLink = screen.getByText('¿Olvidaste tu contraseña?');
        fireEvent.click(forgotLink);

        expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
    });
});
