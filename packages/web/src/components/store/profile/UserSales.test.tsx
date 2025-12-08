import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserSales from './UserSales';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

import { fetchApi } from '../../../utils/api';

describe('UserSales', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        vi.mocked(fetchApi).mockImplementation(() => new Promise(() => { }));

        render(<UserSales />);

        expect(screen.getByText(/cargando historial/i)).toBeInTheDocument();
    });

    it('shows empty state with CTA to catalog', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        } as any);

        render(<UserSales />);

        await waitFor(() => {
            expect(screen.getByText(/no has realizado compras/i)).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /explorar catálogo/i })).toHaveAttribute('href', '/tienda/productos');
        });
    });

    it('renders sale cards with line items', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        const mockSales = [
            {
                id: 101,
                fecha: '2024-03-10T10:00:00Z',
                estado: 'APROBADO',
                montoTotal: 150000,
                lineasVenta: [
                    { id: 1, cantidad: 2, subTotal: 100000, producto: { nombre: 'SSD 500GB' } },
                    { id: 2, cantidad: 1, subTotal: 50000, producto: { nombre: 'RAM 16GB' } }
                ]
            }
        ];

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockSales })
        } as any);

        render(<UserSales />);

        await waitFor(() => {
            expect(screen.getByText('Orden #101')).toBeInTheDocument();
            expect(screen.getByText('SSD 500GB')).toBeInTheDocument();
            expect(screen.getByText('RAM 16GB')).toBeInTheDocument();
            expect(screen.getByText('x2')).toBeInTheDocument();
        });
    });

    it('shows pay button for pending payment status', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        const mockSales = [
            {
                id: 102,
                fecha: '2024-03-10T10:00:00Z',
                estado: 'PENDIENTE_PAGO',
                montoTotal: 50000,
                lineasVenta: [
                    { id: 1, cantidad: 1, subTotal: 50000, producto: { nombre: 'Mouse' } }
                ]
            }
        ];

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockSales })
        } as any);

        render(<UserSales />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /pagar ahora/i })).toBeInTheDocument();
        });
    });

    it('shows tracking link for shipped status', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        const mockSales = [
            {
                id: 103,
                fecha: '2024-03-10T10:00:00Z',
                estado: 'ENVIADO',
                montoTotal: 80000,
                codigoSeguimiento: 'ABC123',
                lineasVenta: [
                    { id: 1, cantidad: 1, subTotal: 80000, producto: { nombre: 'Teclado' } }
                ]
            }
        ];

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockSales })
        } as any);

        render(<UserSales />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /seguir envío/i })).toHaveAttribute(
                'href',
                expect.stringContaining('ABC123')
            );
        });
    });

    it('shows delivered badge for completed orders', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            token: 'test-token'
        } as any);

        const mockSales = [
            {
                id: 104,
                fecha: '2024-03-10T10:00:00Z',
                estado: 'ENTREGADO',
                montoTotal: 120000,
                lineasVenta: [
                    { id: 1, cantidad: 1, subTotal: 120000, producto: { nombre: 'Monitor' } }
                ]
            }
        ];

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockSales })
        } as any);

        render(<UserSales />);

        await waitFor(() => {
            // StatusBadge should show "Entregado" and the action should be shown
            expect(screen.getAllByText(/entregado/i).length).toBeGreaterThan(0);
        });
    });
});
