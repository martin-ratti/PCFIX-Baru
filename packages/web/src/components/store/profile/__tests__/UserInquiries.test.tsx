import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserInquiries from './UserInquiries';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

global.fetch = vi.fn();

describe('UserInquiries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            token: 'test-token'
        } as any);

        (global.fetch as any).mockImplementation(() => new Promise(() => { }));

        render(<UserInquiries />);

        expect(screen.getByText(/cargando consultas/i)).toBeInTheDocument();
    });

    it('shows empty state with CTA link', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            token: 'test-token'
        } as any);

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        });

        render(<UserInquiries />);

        await waitFor(() => {
            expect(screen.getByText(/no has realizado consultas técnicas/i)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /servicio técnico/i })).toHaveAttribute('href', '/servicio-tecnico');
        });
    });

    it('renders inquiry cards with status badges', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            token: 'test-token'
        } as any);

        const mockInquiries = [
            {
                id: 1,
                asunto: 'Reparación PC',
                mensaje: 'Mi PC no enciende',
                estado: 'PENDIENTE',
                createdAt: '2024-03-10T10:00:00Z'
            },
            {
                id: 2,
                asunto: 'Upgrade GPU',
                mensaje: 'Quiero cambiar mi placa de video',
                estado: 'RESPONDIDO',
                respuesta: 'Te recomiendo una RTX 4070',
                createdAt: '2024-03-09T15:30:00Z',
                respondedAt: '2024-03-09T18:00:00Z'
            }
        ];

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<UserInquiries />);

        await waitFor(() => {
            expect(screen.getByText('Reparación PC')).toBeInTheDocument();
            expect(screen.getByText('Upgrade GPU')).toBeInTheDocument();
            expect(screen.getByText('Pendiente')).toBeInTheDocument();
            expect(screen.getByText('Respuesta Disponible')).toBeInTheDocument();
        });
    });

    it('shows response for answered inquiries', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            token: 'test-token'
        } as any);

        const mockInquiries = [
            {
                id: 1,
                asunto: 'Consulta',
                mensaje: 'Pregunta',
                estado: 'RESPONDIDO',
                respuesta: 'Esta es la respuesta del técnico',
                createdAt: '2024-03-10T10:00:00Z',
                respondedAt: '2024-03-10T12:00:00Z'
            }
        ];

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<UserInquiries />);

        await waitFor(() => {
            expect(screen.getByText('Esta es la respuesta del técnico')).toBeInTheDocument();
            expect(screen.getByText(/respuesta de pcfix/i)).toBeInTheDocument();
        });
    });

    it('stops loading if no token', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            token: null
        } as any);

        render(<UserInquiries />);

        await waitFor(() => {
            expect(screen.getByText(/no has realizado consultas/i)).toBeInTheDocument();
        });
    });
});
