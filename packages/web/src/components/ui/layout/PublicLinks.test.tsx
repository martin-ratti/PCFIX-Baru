import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PublicLinks from './PublicLinks';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('PublicLinks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders navigation links for regular users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' }
        } as any);

        render(<PublicLinks />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /nosotros/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /servicio técnico/i })).toBeInTheDocument();
        });
    });

    it('renders navigation links for guests', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<PublicLinks />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /nosotros/i })).toBeInTheDocument();
        });
    });

    it('has correct href attributes', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null
        } as any);

        render(<PublicLinks />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /nosotros/i })).toHaveAttribute('href', '/info/nosotros');
            expect(screen.getByRole('link', { name: /servicio técnico/i })).toHaveAttribute('href', '/tienda/servicios');
        });
    });
});
