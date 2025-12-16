import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SaleDetailModal from '../SaleDetailModal';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
    API_URL: 'http://local-test-api'
}));

describe('SaleDetailModal', () => {
    const mockOnClose = vi.fn();
    const mockOnApprove = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnDispatch = vi.fn();
    const mockAddToast = vi.fn();

    const mockSale = {
        id: 1,
        createdAt: '2024-01-15T10:00:00Z',
        estado: 'PENDIENTE_APROBACION',
        metodoPago: 'TRANSFERENCIA',
        medioPago: 'TRANSFERENCIA',
        tipoRetiro: 'ENVIO',
        total: 150000,
        cliente: { user: { nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' } },
        lineasVenta: [
            { id: 1, cantidad: 2, precio: 50000, producto: { nombre: 'Producto 1' } },
            { id: 2, cantidad: 1, precio: 50000, producto: { nombre: 'Producto 2' } },
        ],
        envio: { trackingNumber: null, direccion: 'Calle 123, Ciudad' },
    };

    const defaultProps = {
        isOpen: true,
        sale: mockSale,
        onClose: mockOnClose,
        onApprove: mockOnApprove,
        onReject: mockOnReject,
        onDispatch: mockOnDispatch,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ token: 'test-token' } as any);
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<SaleDetailModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when sale is null', () => {
        const { container } = render(<SaleDetailModal {...defaultProps} sale={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('displays sale details when open', () => {
        render(<SaleDetailModal {...defaultProps} />);
        expect(screen.getByText(/Venta #1/)).toBeInTheDocument();
    });

    it('displays customer information', () => {
        render(<SaleDetailModal {...defaultProps} />);
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });

    it('displays items list', () => {
        render(<SaleDetailModal {...defaultProps} />);
        expect(screen.getByText('Producto 1')).toBeInTheDocument();
        expect(screen.getByText('Producto 2')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        render(<SaleDetailModal {...defaultProps} />);
        const closeBtn = screen.getByRole('button', { name: /cerrar/i });
        fireEvent.click(closeBtn);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows approve/reject buttons for pending sales', () => {
        render(<SaleDetailModal {...defaultProps} />);
        expect(screen.getByText('Confirmar Acreditación')).toBeInTheDocument();
        expect(screen.getByText('Rechazar')).toBeInTheDocument();
    });

    it('shows payment method badge', () => {
        render(<SaleDetailModal {...defaultProps} />);
        expect(screen.getByText('TRANSFERENCIA')).toBeInTheDocument();
    });
});
