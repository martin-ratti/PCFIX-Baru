import React, { useEffect, useRef } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchApi } from '../../utils/api';

export default function CartSync() {
    const { items } = useCartStore();
    const { user, isAuthenticated } = useAuthStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                // Sync cart to backend
                await fetchApi('/cart/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        items: items.map(item => ({ id: item.id, quantity: item.quantity }))
                    })
                });

            } catch (error) {
                console.error('Failed to sync cart:', error);
            }
        }, 2000); // Debounce 2 sec

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [items, isAuthenticated, user?.id]);

    return null; // Componente lógico, sin UI
}
