import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartView from '../CartView';
import { useCartStore } from '../../../../stores/cartStore';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
vi.mock('../../../../stores/cartStore', () => ({
    useCartStore: vi.fn()
}));
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));
vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));
vi.mock('../../../../stores/favoritesStore', () => ({
    useFavoritesStore: vi.fn(() => ({ favorites: [], toggleFavorite: vi.fn(), isFavorite: vi.fn() }))
}));

vi.mock('../../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm }: any) => isOpen ? (
        <div data-testid="confirm-clear-modal">
            <button onClick={onConfirm}>Confirm Clear</button>
        </div>
    ) : null
}));

describe('CartView', () => {
    const mockCart = {
        items: [],
        addToast: vi.fn(),
        removeItem: vi.fn(),
        increaseQuantity: vi.fn(),
        decreaseQuantity: vi.fn(),
        clearCart: vi.fn(),
        total: 0
    };

    const mockAuth = {
        user: { id: 1, nombre: 'Test', email: 'test@test.com' },
        isAuthenticated: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCartStore).mockReturnValue(mockCart as any);
        vi.mocked(useAuthStore).mockReturnValue(mockAuth as any);
        vi.mocked(useToastStore).mockReturnValue(vi.fn());
        global.fetch = vi.fn().mockResolvedValue({
            json: async () => ({ success: true, data: { costoEnvioFijo: 5000 } })
        });
    });

    it('renders empty cart state', async () => {
        render(<CartView />);

        await waitFor(() => {
            expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
        });
        expect(screen.getByText(/ir a la tienda/i)).toBeInTheDocument();
    });

    it('renders items in cart', async () => {
        const items = [
            { id: 1, name: 'Product 1', price: 1000, quantity: 2, stock: 10, imageUrl: 'img.jpg' },
            { id: 2, name: 'Product 2', price: 500, quantity: 1, stock: 10, imageUrl: 'img.jpg' }
        ];
        vi.mocked(useCartStore).mockReturnValue({ ...mockCart, items } as any);

        render(<CartView />);

        await waitFor(() => {
            expect(screen.getByText('Product 1')).toBeInTheDocument();
        });
        expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('renders clear button and opens modal', async () => {
        const items = [{ id: 1, name: 'Product 1', price: 1000, quantity: 1, stock: 10 }];
        vi.mocked(useCartStore).mockReturnValue({ ...mockCart, items } as any);

        render(<CartView />);

        await waitFor(() => expect(screen.getByText('Product 1')).toBeInTheDocument());

        const clearBtn = screen.getByText(/vaciar carrito/i);
        fireEvent.click(clearBtn);

        expect(screen.getByTestId('confirm-clear-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm Clear'));
        expect(mockCart.clearCart).toHaveBeenCalled();
    });
});
