import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import { act } from '@testing-library/react';

describe('Cart Store', () => {
    beforeEach(() => {
        
        act(() => useCartStore.getState().clearCart());
        sessionStorage.clear();
    });

    const mockProduct = {
        id: '1',
        name: 'Test',
        price: 100,
        slug: 'test',
        imageUrl: 'img',
        imageAlt: 'alt',
        stock: 5,
        description: 'desc'
    };

    it('should start with empty items', () => {
        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should add item', () => {
        act(() => useCartStore.getState().addItem(mockProduct));

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0]).toEqual(expect.objectContaining({ id: '1', quantity: 1 }));
    });

    it('should increment quantity if adding existing item', () => {
        act(() => useCartStore.getState().addItem(mockProduct));
        act(() => useCartStore.getState().addItem(mockProduct));

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(2);
    });

    it('should remove item', () => {
        act(() => useCartStore.getState().addItem(mockProduct));
        act(() => useCartStore.getState().removeItem('1'));

        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should respect persistence', () => {
        act(() => useCartStore.getState().addItem(mockProduct));

        
        const storage = JSON.parse(sessionStorage.getItem('cart-session-storage') || '{}');
        expect(storage.state.items).toHaveLength(1);
    });
});
