import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';
import { useAuthStore } from '../../../../stores/authStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));


import { navigate } from 'astro:transitions/client';

describe('SearchBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input for regular users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' }
        } as any);

        render(<SearchBar />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
        });
    });

    it('renders search input for guests', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<SearchBar />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
        });
    });

    it('navigates to search results on form submit', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<SearchBar />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/buscar productos/i);
        fireEvent.change(input, { target: { value: 'RAM' } });

        const form = input.closest('form');
        fireEvent.submit(form!);

        expect(navigate).toHaveBeenCalledWith('/tienda/productos?search=RAM');
    });

    it('does not navigate for empty search term', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<SearchBar />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/buscar productos/i);
        const form = input.closest('form');
        fireEvent.submit(form!);

        expect(navigate).not.toHaveBeenCalled();
    });
});
