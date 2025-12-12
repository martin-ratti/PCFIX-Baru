import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SupportInbox from '../SupportInbox';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
global.fetch = vi.fn();

vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

describe('SupportInbox (admin/support)', () => {
    const mockAddToast = vi.fn();

    const mockInquiries = [
        {
            id: 1,
            asunto: 'Problema Técnico',
            mensaje: 'Mi PC no enciende',
            estado: 'PENDIENTE',
            createdAt: '2024-03-10T10:00:00Z',
            user: { nombre: 'Juan', email: 'juan@test.com' }
        },
        {
            id: 2,
            asunto: 'Consulta Servicio',
            mensaje: 'Quiero saber precios',
            estado: 'RESPONDIDO',
            respuesta: 'El precio es $5000',
            createdAt: '2024-03-09T15:30:00Z',
            user: { nombre: 'María', email: 'maria@test.com' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ token: 'test-token' } as any);
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
    });

    it('shows loading state initially', () => {
        (global.fetch as any).mockImplementation(() => new Promise(() => { }));
        render(<SupportInbox />);
        expect(screen.getByText(/cargando consultas/i)).toBeInTheDocument();
    });

    it('renders inquiries list', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText('Problema Técnico')).toBeInTheDocument();
            expect(screen.getByText('Consulta Servicio')).toBeInTheDocument();
        });
    });

    it('shows empty state when no inquiries', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: [] })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText(/no hay consultas técnicas pendientes/i)).toBeInTheDocument();
        });
    });

    it('displays response for answered inquiries', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockInquiries })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText('El precio es $5000')).toBeInTheDocument();
        });
    });

    it('deletes an inquiry when confirmed', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: mockInquiries })
        });

        global.confirm = vi.fn(() => true);

        // Mock delete success
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(<SupportInbox />);

        await waitFor(() => {
            expect(screen.getByText('Problema Técnico')).toBeInTheDocument();
        });

        const deleteBtns = screen.getAllByTitle('Eliminar consulta');
        fireEvent.click(deleteBtns[0]);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/technical/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
            expect(screen.queryByText('Problema Técnico')).not.toBeInTheDocument();
        });
    });
});
