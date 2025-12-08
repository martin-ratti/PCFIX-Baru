import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileForm from './EditProfileForm';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

import { fetchApi } from '../../../utils/api';

describe('EditProfileForm', () => {
    const mockLogin = vi.fn();
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Juan', apellido: 'Perez' },
            token: 'test-token',
            login: mockLogin
        } as any);

        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
    });

    it('shows loading state initially', () => {
        vi.mocked(fetchApi).mockImplementation(() => new Promise(() => { }));

        render(<EditProfileForm userId="1" />);

        expect(screen.getByText('Cargando tu perfil...')).toBeInTheDocument();
    });

    it('renders form with loaded user data', async () => {
        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({
                success: true,
                data: { nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com' }
            })
        } as any);

        render(<EditProfileForm userId="1" />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Perez')).toBeInTheDocument();
            expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument();
        });
    });

    it('shows validation error for short name', async () => {
        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({
                success: true,
                data: { nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com' }
            })
        } as any);

        render(<EditProfileForm userId="1" />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
        });

        const nombreInput = screen.getByDisplayValue('Juan');
        fireEvent.change(nombreInput, { target: { value: 'J' } });

        const submitBtn = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument();
        });
    });

    it('updates profile and auth store on successful save', async () => {
        vi.mocked(fetchApi)
            .mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com' }
                })
            } as any)
            .mockResolvedValueOnce({
                json: async () => ({ success: true })
            } as any);

        render(<EditProfileForm userId="1" />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
        });

        const nombreInput = screen.getByDisplayValue('Juan');
        fireEvent.change(nombreInput, { target: { value: 'JuanCarlos' } });

        const submitBtn = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith(
                expect.stringContaining('actualizado'),
                'success'
            );
        });
    });

    it('shows email field as disabled', async () => {
        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({
                success: true,
                data: { nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com' }
            })
        } as any);

        render(<EditProfileForm userId="1" />);

        await waitFor(() => {
            const emailInput = screen.getByDisplayValue('juan@test.com');
            expect(emailInput).toBeDisabled();
        });
    });
});
