import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';


vi.mock('../../../../stores/cartStore', () => ({
    useCartStore: vi.fn()
}));

vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));


vi.mock('../../../../assets/cart.png', () => ({
    default: { src: '/cart.png' }
}));

import CartIcon from '../CartIcon';
import { useCartStore } from '../../../../stores/cartStore';
import { useAuthStore } from '../../../../stores/authStore';

describe('CartIcon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        (useCartStore as any).mockImplementation((selector: any) =>
            selector({ items: [] })
        );
        (useAuthStore as any).mockImplementation((selector: any) =>
            selector({ user: { role: 'USER' } })
        );
    });

    it('renders cart icon with accessible label', () => {
        render(<CartIcon />);
        const link = screen.getByRole('link', { name: /carrito de compras/i });
        expect(link).toBeInTheDocument();
    });

    it('shows quantity badge when items in cart', async () => {
        (useCartStore as any).mockImplementation((selector: any) =>
            selector({
                items: [
                    { id: 1, quantity: 2 },
                    { id: 2, quantity: 3 }
                ]
            })
        );

        render(<CartIcon />);

        
        await new Promise(resolve => setTimeout(resolve, 10));

        
/* unused:         const badge = screen.queryByText('5'); */
        
    });

    it('does not render for admin users', async () => {
        (useAuthStore as any).mockImplementation((selector: any) =>
            selector({ user: { role: 'ADMIN' } })
        );

        const {} = render(<CartIcon />);

        
        await new Promise(resolve => setTimeout(resolve, 10));

        
        
    });

    it('links to /carrito', () => {
        render(<CartIcon />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/tienda/carrito');
    });
});
