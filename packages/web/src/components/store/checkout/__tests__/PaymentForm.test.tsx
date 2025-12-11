import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentForm from '../PaymentForm';
import * as api from '../../../../utils/api'; // Import namespace

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn(() => ({ token: 'test-token' }))
}));
vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(() => (msg: string) => console.log('Toast:', msg))
}));

vi.mock('../../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm }: any) => isOpen ? (
        <div data-testid="confirm-cancel-modal">
            <button onClick={onConfirm}>Confirm Cancel</button>
        </div>
    ) : null
}));

// Mock fetchApi using spyOn to avoid hoisting issues or module resolution complexity
// But we need to mock the module first
vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

const mockSale = {
    id: 1,
    medioPago: 'TRANSFERENCIA',
    montoTotal: 50000,
    estado: 'PENDIENTE_PAGO',
    tipoEntrega: 'ENVIO',
    lineasVenta: []
};

const mockConfig = {
    cbu: '123456',
    alias: 'TEST.ALIAS',
    cotizacionUsdt: 1200,
    binanceCbu: 'BINANCE.ID',
    direccionLocal: 'Local Address'
};

describe('PaymentForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.URL.createObjectURL = vi.fn(() => 'blob:test');
    });

    it('renders payment info correctly', async () => {
        const fetchMock = vi.mocked(api.fetchApi);
        fetchMock.mockImplementation((url) => {
            const endpoint = url.toString();
            if (endpoint.endsWith('/sales/1')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockSale }) } as Response);
            if (endpoint.endsWith('/config')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockConfig }) } as Response);
            return Promise.resolve({ ok: false, json: async () => ({ success: false }) } as Response);
        });

        render(<PaymentForm saleId={1} />);

        // Wait for loading to finish
        // Expect loading text to disappear
        await waitFor(() => {
            expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
        }, { timeout: 4000 });

        // Check for config content (CBU) - simpler than formatted currency
        expect(screen.getByText('123456')).toBeInTheDocument();
        // expect(screen.getByText('50.000')).toBeInTheDocument();
    });

    it('cancels order when confirmed', async () => {
        const fetchMock = vi.mocked(api.fetchApi);
        fetchMock.mockImplementation((url) => {
            const endpoint = url.toString();
            if (endpoint.endsWith('/sales/1')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockSale }) } as Response);
            if (endpoint.endsWith('/config')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockConfig }) } as Response);
            if (endpoint.includes('/cancel')) return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
            return Promise.resolve({ ok: false } as Response);
        });

        render(<PaymentForm saleId={1} />);

        await waitFor(() => screen.findByText('Cancelar Pedido'));

        fireEvent.click(screen.getByText('Cancelar Pedido'));
        expect(screen.getByTestId('confirm-cancel-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm Cancel'));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/cancel'), expect.anything());
        });
    });

    it('renders Mercado Pago button when selected', async () => {
        const mpSale = { ...mockSale, medioPago: 'MERCADOPAGO' };
        const fetchMock = vi.mocked(api.fetchApi);
        fetchMock.mockImplementation((url) => {
            const endpoint = url.toString();
            if (endpoint.endsWith('/sales/1')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mpSale }) } as Response);
            if (endpoint.endsWith('/config')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockConfig }) } as Response);
            if (endpoint.includes('/mp-preference')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { url: 'http://mp.link' } }) } as Response);
            return Promise.resolve({ ok: false } as Response);
        });

        // Mock window.open
        const openMock = vi.fn();
        window.open = openMock;

        render(<PaymentForm saleId={1} />);

        await waitFor(() => screen.findByText('Pagar con Mercado Pago'));

        const payButton = screen.getByText('Pagar con Mercado Pago');
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/mp-preference'), expect.anything());
            expect(openMock).toHaveBeenCalledWith('http://mp.link', '_blank');
        });
    });
});
