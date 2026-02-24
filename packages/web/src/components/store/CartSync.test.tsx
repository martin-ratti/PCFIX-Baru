import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import CartSync from './CartSync';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import * as apiUtils from '../../utils/api';


vi.mock('../../stores/cartStore');
vi.mock('../../stores/authStore');


vi.mock('../../utils/api', () => ({
    fetchApi: vi.fn()
}));

describe('CartSync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should sync cart when authenticated and items change', async () => {
        (useAuthStore as any).mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
        (useCartStore as any).mockReturnValue({ items: [{ id: 1, quantity: 2 }] });

        render(<CartSync />);

        
        vi.advanceTimersByTime(2000);

        expect(apiUtils.fetchApi).toHaveBeenCalledWith('/cart/sync', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                userId: 1,
                items: [{ id: 1, quantity: 2 }]
            })
        }));
    });

    it('should not sync if not authenticated', async () => {
        (useAuthStore as any).mockReturnValue({ isAuthenticated: false, user: null });
        (useCartStore as any).mockReturnValue({ items: [{ id: 1, quantity: 2 }] });

        render(<CartSync />);

        vi.advanceTimersByTime(2000);

        expect(apiUtils.fetchApi).not.toHaveBeenCalled();
    });
});
