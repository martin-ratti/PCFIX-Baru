import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FavoritesPageContent from './FavoritesPageContent';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../store/product/ProductCard', () => ({
    default: ({ product }: any) => <div data-testid="product-card">{product.name}</div>
}));

global.fetch = vi.fn();

describe('FavoritesPageContent', () => {
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
    });

    it('shows loading skeleton initially', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            isAuthenticated: true
        } as any);

        (global.fetch as any).mockImplementation(() => new Promise(() => { }));

        render(<FavoritesPageContent />);

        // Loading skeleton should have pulse animation class
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows login prompt when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<FavoritesPageContent />);

        await waitFor(() => {
            expect(screen.getByText(/inicia sesión para ver tus favoritos/i)).toBeInTheDocument();
        }, { timeout: 500 });
    });

    it('shows empty state when no favorites', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            isAuthenticated: true
        } as any);

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        });

        render(<FavoritesPageContent />);

        await waitFor(() => {
            expect(screen.getByText(/lista de deseos está vacía/i)).toBeInTheDocument();
        }, { timeout: 500 });
    });

    it('renders product cards for favorites', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            isAuthenticated: true
        } as any);

        const mockProducts = [
            { id: 1, nombre: 'SSD 500GB', precio: 50000, foto: '', descripcion: 'Disco', stock: 10 },
            { id: 2, nombre: 'RAM 16GB', precio: 80000, foto: '', descripcion: 'Memoria', stock: 5 }
        ];

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: mockProducts })
        });

        render(<FavoritesPageContent />);

        await waitFor(() => {
            expect(screen.getByText('SSD 500GB')).toBeInTheDocument();
            expect(screen.getByText('RAM 16GB')).toBeInTheDocument();
        }, { timeout: 500 });
    });

    it('shows error toast on API failure', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1 },
            isAuthenticated: true
        } as any);

        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        render(<FavoritesPageContent />);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith(
                expect.stringContaining('Error'),
                'error'
            );
        }, { timeout: 500 });
    });
});
