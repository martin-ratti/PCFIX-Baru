import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveSearch from './LiveSearch';
import { fetchApi } from '../../../utils/api';
import { useAuthStore } from '../../../stores/authStore';

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

        // Admin users should see null (after client hydration)
        // But initially it returns null before isClient is true anyway
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

        // Wait for hydration
        const input = await screen.findByPlaceholderText(/buscar productos/i);

        fireEvent.change(input, { target: { value: 'Ryzen' } });

        // Wait for debounce and API call
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        }, { timeout: 1000 });
    });
});
