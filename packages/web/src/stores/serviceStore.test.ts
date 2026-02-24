import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useServiceStore } from './serviceStore';


global.fetch = vi.fn();

describe('serviceStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useServiceStore.setState({ items: [], isLoading: false });
    });

    describe('initial state', () => {
        it('should start with empty items and not loading', () => {
            const { result } = renderHook(() => useServiceStore());

            expect(result.current.items).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('fetchItems', () => {
        it('should fetch and set service items', async () => {
            const mockItems = [
                { id: 1, title: 'Service 1', price: 1000, description: 'Desc 1' },
                { id: 2, title: 'Service 2', price: 2000, description: 'Desc 2' }
            ];

            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true, data: mockItems })
            });

            const { result } = renderHook(() => useServiceStore());

            await act(async () => {
                await result.current.fetchItems();
            });

            expect(result.current.items).toEqual(mockItems);
            expect(result.current.isLoading).toBe(false);
        });

        it('should set isLoading to true while fetching', async () => {
            let resolvePromise: any;
            const fetchPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            (global.fetch as any).mockReturnValue(fetchPromise);

            const { result } = renderHook(() => useServiceStore());

            act(() => {
                result.current.fetchItems();
            });

            
            expect(result.current.isLoading).toBe(true);

            
            await act(async () => {
                resolvePromise({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: [] })
                });
            });

            expect(result.current.isLoading).toBe(false);
        });

        it('should handle API errors gracefully', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useServiceStore());

            await act(async () => {
                await result.current.fetchItems();
            });

            expect(result.current.items).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });

        it('should handle non-ok response', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500
            });

            const { result } = renderHook(() => useServiceStore());

            await act(async () => {
                await result.current.fetchItems();
            });

            expect(result.current.items).toEqual([]);
        });
    });

    describe('updateItem', () => {
        it('should update a specific item', () => {
            const { result } = renderHook(() => useServiceStore());

            act(() => {
                useServiceStore.setState({
                    items: [
                        { id: 1, title: 'Old Title', price: 1000, description: 'Old' },
                        { id: 2, title: 'Other', price: 2000, description: 'Other' }
                    ]
                });
            });

            act(() => {
                result.current.updateItem(1, { title: 'New Title', price: 1500 });
            });

            expect(result.current.items[0].title).toBe('New Title');
            expect(result.current.items[0].price).toBe(1500);
            expect(result.current.items[1].title).toBe('Other');
        });

        it('should not modify other items', () => {
            const { result } = renderHook(() => useServiceStore());

            act(() => {
                useServiceStore.setState({
                    items: [
                        { id: 1, title: 'Item 1', price: 1000, description: 'Desc 1' },
                        { id: 2, title: 'Item 2', price: 2000, description: 'Desc 2' }
                    ]
                });
            });

            act(() => {
                result.current.updateItem(1, { price: 9999 });
            });

            expect(result.current.items[1].price).toBe(2000);
        });
    });
});
