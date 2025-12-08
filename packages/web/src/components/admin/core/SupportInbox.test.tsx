import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SupportInbox from './SupportInbox';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
global.fetch = vi.fn();

vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

describe('SupportInbox', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockAddToast = vi.fn();

    const mockInquiries = [
        {
            id: 1,
            asunto: 'Presupuesto Reparación',
            mensaje: 'Consulta sobre mi PC',
            estado: 'PENDIENTE',
            respuesta: null,
            createdAt: '2024-03-10T10:00:00Z',
            user: { nombre: 'Juan', apellido: 'Pérez' }
        },
        {
            id: 2,
            asunto: 'Consulta General',
            mensaje: 'Problema con envío',
            estado: 'RESPONDIDO',
            respuesta: 'Ya respondimos',
            createdAt: '2024-03-09T15:30:00Z',
            user: { nombre: 'María', apellido: 'García' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({ token: 'test-token', logout: vi.fn() } as any);
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
    });

    it('renders loading state initially', () => {
        (global.fetch as any).mockImplementation(() => new Promise(() => { }));
        render(<SupportInbox />);
        expect(screen.getByText(/sincronizando bandeja/i)).toBeInTheDocument();
    });

    it('renders inquiries list with asunto and mensaje', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText('Presupuesto Reparación')).toBeInTheDocument();
            expect(screen.getByText('Consulta sobre mi PC')).toBeInTheDocument();
        });
    });

    it('shows estado badge for pending inquiries', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
            expect(screen.getByText('RESPONDIDO')).toBeInTheDocument();
        });
    });

    it('renders empty state when no inquiries', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [] })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText(/no hay consultas técnicas pendientes/i)).toBeInTheDocument();
        });
    });
});
