import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManualSaleForm from '../ManualSaleForm';
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

vi.mock('../../../ui/feedback/ConfirmModal', () => ({
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

        
        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/products')) {
                return Promise.resolve({
                    json: async () => ({ success: true, data: mockProducts })
                } as unknown as Response);
            }
            if (url.includes('/sales/manual')) {
                return Promise.resolve({
                    json: async () => ({ success: true })
                } as unknown as Response);
            }
            return Promise.resolve({ json: async () => ({ success: false }) } as unknown as Response);
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

        
        await waitFor(() => {
            expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
        });

        
        fireEvent.click(screen.getByText('Producto Test 1'));

        
        await waitFor(() => {
            expect(screen.getByText('1 ítems')).toBeInTheDocument();
        });

        
        const emailInput = screen.getByPlaceholderText(/email cliente/i);
        fireEvent.change(emailInput, { target: { value: 'client@test.com' } });

        
        const submitBtn = screen.getByRole('button', { name: /cobrar/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        
        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        });

        
        fireEvent.click(screen.getByText('Confirm Sale'));

        
        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/sales/manual', expect.objectContaining({ method: 'POST' }));
            expect(mockAddToast).toHaveBeenCalledWith("Venta registrada!", 'success');
        });
    });
});
