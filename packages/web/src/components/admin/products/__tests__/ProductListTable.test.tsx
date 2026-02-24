import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductListTable from '../ProductListTable';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';
import { fetchApi } from '../../../../utils/api';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('../UpdateStockModal', () => ({
    default: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
        <div data-testid="stock-modal">
            <button onClick={() => onConfirm(50)}>Confirm Stock</button>
            <button onClick={onCancel}>Cancel Stock</button>
        </div>
    ) : null
}));

vi.mock('../DiscountModal', () => ({
    default: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
        <div data-testid="discount-modal">
            <button onClick={() => onConfirm(100, 200)}>Confirm Discount</button>
            <button onClick={onCancel}>Cancel Discount</button>
        </div>
    ) : null
}));

vi.mock('../../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
            <button onClick={onCancel}>Cancel Delete</button>
        </div>
    ) : null
}));

describe('ProductListTable', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockFetchApi = vi.mocked(fetchApi);
    const mockAddToast = vi.fn();

    const mockProducts = [
        {
            id: 1,
            nombre: 'Product 1',
            precio: '1000',
            precioOriginal: null,
            stock: 10,
            isFeatured: false,
            categoria: { nombre: 'Cat 1' }
        },
        {
            id: 2,
            nombre: 'Product 2',
            precio: '2000',
            precioOriginal: '2500',
            stock: 0,
            isFeatured: true,
            categoria: { nombre: 'Cat 2' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        mockFetchApi.mockImplementation((url: string) => {
            if (url.includes('/categories')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Cat 1' }] })
                } as any);
            }
            if (url.includes('/brands')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Brand 1' }] })
                } as any);
            }
            if (url.includes('/products')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockProducts, meta: { totalPages: 1 } })
                } as any);
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, data: {} })
            } as any);
        });
    });

    it('renders products list', async () => {
        render(<ProductListTable />);

        await waitFor(() => {
            const p1 = screen.getAllByText('Product 1');
            expect(p1.length).toBeGreaterThan(0);
            expect(p1[0]).toBeInTheDocument();

            const p2 = screen.getAllByText('Product 2');
            expect(p2.length).toBeGreaterThan(0);
            expect(p2[0]).toBeInTheDocument();
        });
    });

    it('shows low stock warning row', async () => {
        render(<ProductListTable />);

        await waitFor(() => {
            
            const zeroStock = screen.getAllByText('0')[0];
            expect(zeroStock).toHaveClass('bg-red-50');
        });
    });

    it('opens delete modal when delete button clicked', async () => {
        render(<ProductListTable />);
        await waitFor(() => expect(screen.getAllByText('Product 1')[0]).toBeInTheDocument());

        const deleteBtns = screen.getAllByTestId('btn-delete');
        fireEvent.click(deleteBtns[0]);

        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    it('opens stock modal when stock is clicked', async () => {
        render(<ProductListTable />);
        await waitFor(() => expect(screen.getAllByText('Product 1')[0]).toBeInTheDocument());

        const stockBtns = screen.getAllByTestId('btn-stock');
        fireEvent.click(stockBtns[0]);

        expect(screen.getByTestId('stock-modal')).toBeInTheDocument();
    });

    it('opens discount modal when discount button clicked', async () => {
        render(<ProductListTable />);
        await waitFor(() => expect(screen.getAllByText('Product 1')[0]).toBeInTheDocument());

        const discountBtns = screen.getAllByTestId('btn-discount');
        fireEvent.click(discountBtns[0]);

        expect(screen.getByTestId('discount-modal')).toBeInTheDocument();
    });
});
