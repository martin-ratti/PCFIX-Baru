import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StoreNavigation from '../StoreNavigation';
import { useAuthStore } from '../../../../stores/authStore';

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

global.fetch = vi.fn();

describe('StoreNavigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        });
    });

    it('renders categories dropdown button', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<StoreNavigation />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });
    });

    it('renders nosotros link', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<StoreNavigation />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /nosotros/i })).toHaveAttribute('href', '/info/nosotros');
        });
    });

    it('fetches and displays categories on hover', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        const mockCategories = [
            { id: 1, nombre: 'Procesadores' },
            { id: 2, nombre: 'Placas de Video' }
        ];

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: mockCategories })
        });

        render(<StoreNavigation />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });

        // Hover to open dropdown
        const dropdown = screen.getByText('Categorías').closest('.group');
        fireEvent.mouseEnter(dropdown!);

        await waitFor(() => {
            expect(screen.getByText('Procesadores')).toBeInTheDocument();
            expect(screen.getByText('Placas de Video')).toBeInTheDocument();
        });
    });

    it('links categories to filtered products page', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        const mockCategories = [
            { id: 99, nombre: 'Test Category' }
        ];

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: mockCategories })
        });

        render(<StoreNavigation />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });

        const dropdown = screen.getByText('Categorías').closest('.group');
        fireEvent.mouseEnter(dropdown!);

        await waitFor(() => {
            const link = screen.getByRole('link', { name: 'Test Category' });
            expect(link).toHaveAttribute('href', '/categoria/99');
        });
    });
});
