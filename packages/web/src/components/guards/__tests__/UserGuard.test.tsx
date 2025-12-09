import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserGuard from '../UserGuard';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('UserGuard', () => {
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        Object.defineProperty(window, 'location', {
            value: { replace: mockReplace },
            writable: true
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('shows loading spinner initially', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<UserGuard><div>User Content</div></UserGuard>);

        expect(screen.queryByText('User Content')).not.toBeInTheDocument();
    });

    it('renders children when user has USER role', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Cliente', role: 'USER' },
            isAuthenticated: true
        } as any);

        render(<UserGuard><div>User Content</div></UserGuard>);

        await waitFor(() => {
            expect(screen.getByText('User Content')).toBeInTheDocument();
        });
    });

    it('redirects to login when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<UserGuard><div>User Content</div></UserGuard>);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/auth/login');
        });
    });

    it('redirects admin to access denied page', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            isAuthenticated: true
        } as any);

        render(<UserGuard><div>User Content</div></UserGuard>);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/acceso-denegado');
        });
    });

    it('uses localStorage fallback for user role check', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                isAuthenticated: true,
                user: { role: 'USER' }
            }
        }));

        render(<UserGuard><div>User Content</div></UserGuard>);

        await waitFor(() => {
            expect(screen.getByText('User Content')).toBeInTheDocument();
        });
    });
});
