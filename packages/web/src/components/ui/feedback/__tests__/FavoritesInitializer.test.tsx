import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import FavoritesInitializer from '../FavoritesInitializer';
import { useAuthStore } from '../../../../stores/authStore';
import { useFavoritesStore } from '../../../../stores/favoritesStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/favoritesStore', () => ({
    useFavoritesStore: vi.fn()
}));

describe('FavoritesInitializer', () => {
    const mockFetchFavorites = vi.fn();
    const mockSetFavorites = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useFavoritesStore).mockReturnValue({
            fetchFavorites: mockFetchFavorites,
            setFavorites: mockSetFavorites
        } as any);
    });

    it('renders nothing visually', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        const { container } = render(<FavoritesInitializer />);
        expect(container.firstChild).toBeNull();
    });

    it('fetches favorites when user is authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 123, nombre: 'Test User' },
            isAuthenticated: true
        } as any);

        render(<FavoritesInitializer />);

        await waitFor(() => {
            expect(mockFetchFavorites).toHaveBeenCalledWith(123);
        });
    });

    it('clears favorites when user is not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<FavoritesInitializer />);

        await waitFor(() => {
            expect(mockSetFavorites).toHaveBeenCalledWith([]);
        });
    });
});
