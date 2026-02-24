
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditProfileForm from '../EditProfileForm';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';
import * as apiUtils from '../../../../utils/api';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(),
    
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
    API_URL: 'http://localhost:3000/api',
}));


vi.mock('../../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, title, message, onConfirm }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <h1>{title}</h1>
            <p>{message}</p>
            <button onClick={onConfirm}>Sí, Eliminar</button>
        </div>
    ) : null
}));


vi.mock('../ChangePasswordModal', () => ({
    default: ({ isOpen }: any) => isOpen ? <div data-testid="change-password-modal">Mock Change Password Modal</div> : null
}));

describe('EditProfileForm', () => {
    const mockAuthStore = {
        user: { id: 1, nombre: 'Test', apellido: 'User', email: 'test@example.com' },
        token: 'token123',
        login: vi.fn(),
        logout: vi.fn(),
    };
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue(mockAuthStore);
        
        (useToastStore as any).mockImplementation((selector: any) => {
            if (selector) return selector({ addToast: mockAddToast });
            return { addToast: mockAddToast };
        });

        
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
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    });

    it('opens change password modal when button clicked', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const changePassBtn = screen.getByText('Cambiar Contraseña');
        fireEvent.click(changePassBtn);

        expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });

    it('should open confirm modal when delete button is clicked', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const deleteBtn = screen.getByText(/Eliminar cuenta/i);
        fireEvent.click(deleteBtn);

        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        expect(screen.getByText(/Esta acción es irreversible/i)).toBeInTheDocument();
    });

    it('should call delete api when confirmed', async () => {
        render(<EditProfileForm userId="1" />);
        await waitFor(() => expect(screen.queryByText('Cargando tu perfil...')).not.toBeInTheDocument());

        const deleteBtn = screen.getByText(/Eliminar cuenta/i);
        fireEvent.click(deleteBtn);

        
        (apiUtils.fetchApi as any).mockResolvedValueOnce({
            json: async () => ({ success: true })
        });

        const confirmBtn = screen.getByText(/Sí, Eliminar/i);
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(apiUtils.fetchApi).toHaveBeenCalledWith('/auth/profile', expect.objectContaining({ method: 'DELETE' }));
            expect(mockAuthStore.logout).toHaveBeenCalled();
        });
    });
});
