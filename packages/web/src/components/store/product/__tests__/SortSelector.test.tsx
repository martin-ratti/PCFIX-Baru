import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SortSelector from './SortSelector';

// Mock Astro navigate
const mockNavigate = vi.fn();
vi.mock('astro:transitions/client', () => ({
    navigate: (url: string) => mockNavigate(url)
}));

describe('SortSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: {
                search: '',
                href: 'http://localhost/tienda/productos'
            },
            writable: true
        });
    });

    it('renders sort selector with default option', () => {
        render(<SortSelector />);

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(screen.getByText('Más Recientes')).toBeInTheDocument();
    });

    it('renders all sort options', () => {
        render(<SortSelector />);

        expect(screen.getByText('Más Recientes')).toBeInTheDocument();
        expect(screen.getByText('Menor Precio')).toBeInTheDocument();
        expect(screen.getByText('Mayor Precio')).toBeInTheDocument();
        expect(screen.getByText('Nombre (A-Z)')).toBeInTheDocument();
    });

    it('reads current sort from URL on mount', () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: '?sort=price_asc',
                href: 'http://localhost/tienda/productos?sort=price_asc'
            },
            writable: true
        });

        render(<SortSelector />);

        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('price_asc');
    });

    it('navigates with sort param when option selected', () => {
        render(<SortSelector />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'price_desc' } });

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('sort=price_desc')
        );
    });

    it('resets page to 1 when changing sort', () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: '?page=5',
                href: 'http://localhost/tienda/productos?page=5'
            },
            writable: true
        });

        render(<SortSelector />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'name_asc' } });

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('page=1')
        );
    });

    it('removes sort param when default option selected', () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: '?sort=price_asc',
                href: 'http://localhost/tienda/productos?sort=price_asc'
            },
            writable: true
        });

        render(<SortSelector />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '' } });

        expect(mockNavigate).toHaveBeenCalled();
        const navigatedUrl = mockNavigate.mock.calls[0][0];
        expect(navigatedUrl).not.toContain('sort=price_asc');
    });
});
