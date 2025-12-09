import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from './AuthGuard';
import { useAuthStore } from '../../stores/authStore';

// Mocks
vi.mock('../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Mock window.location.href
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('shows loading spinner initially', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false
        } as any);

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when user is authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true
        } as any);

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    it('redirects to login when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false
        } as any);

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(window.location.href).toBe('/auth/login');
        });
    });

    it('uses localStorage fallback when store shows not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false
        } as any);

        // Set localStorage with authenticated user
        localStorage.setItem('auth-storage', JSON.stringify({
            state: { isAuthenticated: true }
        }));

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });
});
