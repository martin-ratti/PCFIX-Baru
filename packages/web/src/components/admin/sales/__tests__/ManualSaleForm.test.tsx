import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManualSaleForm from './ManualSaleForm';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';

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

vi.mock('../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Sale</button>
        </div>
    ) : null
}));

describe('ManualSaleForm', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockFetchApi = vi.mocked(fetchApi);
    const mockAddToast = vi.fn();

    const mockProducts = [
        { id: 1, nombre: 'Producto Test 1', precio: '1000', stock: 10, categoria: { nombre: 'Cat' } },
        { id: 2, nombre: 'Producto Test 2', precio: '2000', stock: 5, categoria: { nombre: 'Cat' } }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({ token: 'test-token', user: { id: 1 } } as any);
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        // Mock fetchApi for product search AND sale submission
        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/products')) {
                return Promise.resolve({
                    json: async () => ({ success: true, data: mockProducts })
                });
            }
            if (url.includes('/sales/manual')) {
                return Promise.resolve({
                    json: async () => ({ success: true })
                });
            }
            return Promise.resolve({ json: async () => ({ success: false }) });
        });
    });

    it('renders form and initially empty cart with disabled submit', () => {
        render(<ManualSaleForm />);
        expect(screen.getByText(/ticket/i)).toBeInTheDocument();
        const submitBtn = screen.getByRole('button', { name: /cobrar/i });
        expect(submitBtn).toBeDisabled();
    });

    it('adds product to cart, enables submit, and submits sale', async () => {
        render(<ManualSaleForm />);

        // Wait for products to load (useEffect fetch)
        await waitFor(() => {
            expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
        });

        // Click product to add to cart
        fireEvent.click(screen.getByText('Producto Test 1'));

        // Check cart update
        await waitFor(() => {
            expect(screen.getByText('1 ítems')).toBeInTheDocument();
        });

        // Fill email
        const emailInput = screen.getByPlaceholderText(/email cliente/i);
        fireEvent.change(emailInput, { target: { value: 'client@test.com' } });

        // Submit
        const submitBtn = screen.getByRole('button', { name: /cobrar/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        // Confirm modal should open
        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        });

        // Confirm
        fireEvent.click(screen.getByText('Confirm Sale'));

        // Verify API call
        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/sales/manual', expect.objectContaining({ method: 'POST' }));
            expect(mockAddToast).toHaveBeenCalledWith("Venta registrada!", 'success');
        });
    });
});
