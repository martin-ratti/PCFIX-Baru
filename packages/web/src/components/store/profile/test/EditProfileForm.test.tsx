
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
    // Keep internal implementations if needed, but simple mock is safer
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
    API_URL: 'http://localhost:3000/api',
}));

// Mock ConfirmModal
vi.mock('../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen }: any) => isOpen ? <div data-testid="confirm-modal"></div> : null
}));

// Mock ChangePasswordModal - IMPORTANT: This allows us to test just the OPENING of it
vi.mock('../ChangePasswordModal', () => ({
    default: ({ isOpen }: any) => isOpen ? <div data-testid="change-password-modal">Mock Change Password Modal</div> : null
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
        // Correctly mock the store selector pattern
        (useToastStore as any).mockImplementation((selector: any) => {
            if (selector) return selector({ addToast: mockAddToast });
            return { addToast: mockAddToast };
        });

        // Default GET profile success
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
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('opens change password modal when button clicked', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const changePassBtn = screen.getByText('Cambiar Contraseña');
        fireEvent.click(changePassBtn);

        expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });
});
