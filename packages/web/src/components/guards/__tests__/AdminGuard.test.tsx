import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminGuard from '../AdminGuard';
import { useAuthStore } from '../../../stores/authStore';


vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('AdminGuard', () => {
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        Object.defineProperty(window, 'location', {
            value: { replace: mockReplace },
            writable: true
        });
        
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('shows loading spinner initially', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<AdminGuard><div>Protected Content</div></AdminGuard>);

        
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when user is admin', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            isAuthenticated: true
        } as any);

        render(<AdminGuard><div>Protected Content</div></AdminGuard>);

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    it('redirects to login when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<AdminGuard><div>Protected Content</div></AdminGuard>);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/auth/login');
        });
    });

    it('redirects to access denied when authenticated but not admin', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' },
            isAuthenticated: true
        } as any);

        render(<AdminGuard><div>Protected Content</div></AdminGuard>);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/acceso-denegado');
        });
    });

    it('uses localStorage as fallback for admin check', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        
        localStorage.setItem('auth-storage', JSON.stringify({
            state: { user: { role: 'ADMIN' }, isAuthenticated: true }
        }));

        render(<AdminGuard><div>Protected Content</div></AdminGuard>);

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });
});
