import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryDropdown from './CategoryDropdown';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

global.fetch = vi.fn();

describe('CategoryDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders categories button for regular users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' }
        } as any);

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        });

        render(<CategoryDropdown />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });
    });

    it('uses initial categories prop if provided', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        const initialCategories = [
            { id: 1, nombre: 'Procesadores' },
            { id: 2, nombre: 'Memorias' }
        ];

        render(<CategoryDropdown initialCategories={initialCategories} />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });

        // Hover to open dropdown
        const button = screen.getByText('Categorías');
        fireEvent.mouseEnter(button.closest('.group')!);

        await waitFor(() => {
            expect(screen.getByText('Procesadores')).toBeInTheDocument();
            expect(screen.getByText('Memorias')).toBeInTheDocument();
        });
    });

    it('links to category products page', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        const initialCategories = [
            { id: 5, nombre: 'Placas de Video' }
        ];

        render(<CategoryDropdown initialCategories={initialCategories} />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });

        const button = screen.getByText('Categorías');
        fireEvent.mouseEnter(button.closest('.group')!);

        await waitFor(() => {
            const link = screen.getByRole('link', { name: 'Placas de Video' });
            expect(link).toHaveAttribute('href', '/tienda/productos?categoryId=5');
        });
    });

    it('shows subcategories when category has them', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        const categoriesWithSub = [
            {
                id: 1,
                nombre: 'Componentes',
                subcategorias: [
                    { id: 10, nombre: 'CPUs' },
                    { id: 11, nombre: 'GPUs' }
                ]
            }
        ];

        render(<CategoryDropdown initialCategories={categoriesWithSub} />);

        await waitFor(() => {
            expect(screen.getByText('Categorías')).toBeInTheDocument();
        });

        const button = screen.getByText('Categorías');
        fireEvent.mouseEnter(button.closest('.group')!);

        await waitFor(() => {
            expect(screen.getByText('Componentes')).toBeInTheDocument();
        });
    });
});
