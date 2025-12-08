import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StockAlertModal from './StockAlertModal';

// Mock Auth Store
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn().mockReturnValue({ user: null, isAuthenticated: false }),
}));

// Mock API
vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn(),
}));

// Mock Portal because render in test env is different
vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node, // Render directly in body for test
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
