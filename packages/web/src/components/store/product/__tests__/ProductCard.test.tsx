import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { useCartStore } from '../../../../stores/cartStore';

// Mock dependencies
vi.mock('../../../../stores/cartStore', () => ({
    useCartStore: vi.fn(),
}));

vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn().mockReturnValue({ user: null, isAuthenticated: false }),
}));

vi.mock('../../../../stores/favoritesStore', () => ({
    useFavoritesStore: vi.fn().mockReturnValue({ isFavorite: () => false, addFavorite: vi.fn(), removeFavorite: vi.fn() }),
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn().mockReturnValue(() => { }), // addToast
}));

// Mock navigation
vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn(),
}));

describe('ProductCard', () => {
    const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        imageUrl: 'test.jpg',
        imageAlt: 'Test Alt',
        stock: 10,
        slug: 'test-product',
        categoria: { nombre: 'Hardware' }
    };

    const addItemMock = vi.fn();

    beforeEach(() => {
        (useCartStore as any).mockReturnValue({
            items: [],
            addItem: addItemMock,
            increaseQuantity: vi.fn(),
            decreaseQuantity: vi.fn(),
        });
        vi.clearAllMocks();
    });

    it('renders product details correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('$1.000')).toBeInTheDocument();
        expect(screen.getByText('Agregar')).toBeInTheDocument();
    });

    it('calls addItem when "Agregar" is clicked', () => {
        render(<ProductCard product={mockProduct} />);

        const addButton = screen.getByText('Agregar');
        fireEvent.click(addButton);

        expect(addItemMock).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            name: 'Test Product',
            price: 1000
        }));
    });

    it('shows "Avísame" button when stock is 0', () => {
        const noStockProduct = { ...mockProduct, stock: 0 };
        render(<ProductCard product={noStockProduct} />);

        // Expect "Avísame" button to be present
        expect(screen.getByRole('button', { name: /Avísame/i })).toBeInTheDocument();
        // And "Agregar" should not be present (use queryByText to avoid aria-label conflicts)
        expect(screen.queryByText('Agregar')).not.toBeInTheDocument();
    });
});
