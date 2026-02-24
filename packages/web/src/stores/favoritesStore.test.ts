import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFavoritesStore } from './favoritesStore';


global.fetch = vi.fn();

describe('favoritesStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFavoritesStore.setState({ favoriteIds: [] });
    });

    describe('setFavorites', () => {
        it('should set favorite IDs', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2, 3]);
            });

            expect(result.current.favoriteIds).toEqual([1, 2, 3]);
        });
    });

    describe('addFavorite', () => {
        it('should add a new favorite', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.addFavorite(5);
            });

            expect(result.current.favoriteIds).toContain(5);
        });

        it('should preserve existing favorites', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2]);
                result.current.addFavorite(3);
            });

            expect(result.current.favoriteIds).toEqual([1, 2, 3]);
        });
    });

    describe('removeFavorite', () => {
        it('should remove a favorite', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2, 3]);
                result.current.removeFavorite(2);
            });

            expect(result.current.favoriteIds).toEqual([1, 3]);
        });

        it('should do nothing if favorite does not exist', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2]);
                result.current.removeFavorite(999);
            });

            expect(result.current.favoriteIds).toEqual([1, 2]);
        });
    });

    describe('isFavorite', () => {
        it('should return true for favorited item', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2, 3]);
            });

            expect(result.current.isFavorite(2)).toBe(true);
        });

        it('should return false for non-favorited item', () => {
            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2, 3]);
            });

            expect(result.current.isFavorite(999)).toBe(false);
        });
    });

    describe('fetchFavorites', () => {
        it('should fetch favorites from API and set them', async () => {
            (global.fetch as any).mockResolvedValue({
                json: () => Promise.resolve({
                    success: true,
                    data: [{ id: 10 }, { id: 20 }, { id: 30 }]
                })
            });

            const { result } = renderHook(() => useFavoritesStore());

            await act(async () => {
                await result.current.fetchFavorites(1);
            });

            expect(result.current.favoriteIds).toEqual([10, 20, 30]);
        });

        it('should not update state on API failure', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useFavoritesStore());

            act(() => {
                result.current.setFavorites([1, 2]);
            });

            await act(async () => {
                await result.current.fetchFavorites(1);
            });

            expect(result.current.favoriteIds).toEqual([1, 2]);
        });
    });
});
