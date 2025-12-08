import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveSearch from './LiveSearch';
import { fetchApi } from '../../../utils/api';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client';

// Mock dependencies
vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('LiveSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock as regular user so LiveSearch renders
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' }
        } as any);

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        } as any);
    });

    it('returns null for admin users', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' }
        } as any);

        const { container } = render(<LiveSearch />);
        expect(container.firstChild).toBeNull();
    });

    it('renders search input after hydration for regular users', async () => {
        render(<LiveSearch />);

        // Wait for the input to appear after isClient becomes true
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/buscar productos/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('calls API when user types in search', async () => {
        render(<LiveSearch />);
        const input = await screen.findByPlaceholderText(/buscar productos/i);
        fireEvent.change(input, { target: { value: 'Ryzen' } });
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        }, { timeout: 2000 });
    });

    it('handles keyboard navigation (ArrowDown + Enter)', async () => {
        // Mock API results
        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({
                success: true,
                data: [{ id: 99, nombre: 'Ryzen 9', precio: 500, categoria: { nombre: 'CPU' } }]
            })
        } as any);

        render(<LiveSearch />);
        const input = await screen.findByPlaceholderText(/buscar productos/i);

        // Trigger search
        fireEvent.change(input, { target: { value: 'Ryzen' } });

        // Wait for API call first
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        }, { timeout: 2000 });

        // Wait for results
        await waitFor(() => {
            // Find by finding the button that contains the text
            const buttons = screen.getAllByRole('button');
            const found = buttons.some(b => b.textContent?.includes('Ryzen 9'));
            expect(found).toBe(true);
        }, { timeout: 3000 });

        // Press Arrow Down
        fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

        // Press Enter
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Verify navigation
        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('/producto/99');
        });
    });
});
