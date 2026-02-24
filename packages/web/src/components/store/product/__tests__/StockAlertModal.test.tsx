import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StockAlertModal from '../StockAlertModal';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn().mockReturnValue({ user: null, isAuthenticated: false }),
}));


vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
}));


vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node, 
    };
});

describe('StockAlertModal', () => {
    it('does not render when isOpen is false', () => {
        render(<StockAlertModal isOpen={false} onClose={vi.fn()} productId={1} productName="Test Product" />);
        expect(screen.queryByText('Avísame del Stock')).not.toBeInTheDocument();
    });

    it('renders correctly when open', () => {
        render(<StockAlertModal isOpen={true} onClose={vi.fn()} productId={1} productName="Test Product" />);
        expect(screen.getByText('Avísame del Stock')).toBeInTheDocument();
        expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    });

    it('shows email input for unauthenticated user', () => {
        render(<StockAlertModal isOpen={true} onClose={vi.fn()} productId={1} productName="Test Product" />);
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    });
});
