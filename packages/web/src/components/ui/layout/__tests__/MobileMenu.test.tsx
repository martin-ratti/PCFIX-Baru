import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileMenu from '../MobileMenu';
import { useAuthStore } from '../../../../stores/authStore';

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

// Mock createPortal
vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (node: any) => node
    };
});

global.fetch = vi.fn();

describe('MobileMenu', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true, data: [] })
        });

        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true
        });
    });

    it('renders hamburger button', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /menú/i })).toBeInTheDocument();
        });
    });

    it('shows admin links when logged in as ADMIN', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        // Open menu
        fireEvent.click(screen.getByRole('button', { name: /menú/i }));

        await waitFor(() => {
            // Check for admin links
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
            expect(screen.getByText(/Ventas/i)).toBeInTheDocument();
            expect(screen.getByText(/Productos/i)).toBeInTheDocument();
            expect(screen.getByText(/Configuración/i)).toBeInTheDocument();

            // Check that regular user links are NOT present
            expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
        });
    });

    it('shows user links when logged in as USER', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 2, nombre: 'User', role: 'USER' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        // Open menu
        fireEvent.click(screen.getByRole('button', { name: /menú/i }));

        await waitFor(() => {
            // Check for user links
            expect(screen.getByText('Inicio')).toBeInTheDocument();
            expect(screen.getByText('Productos')).toBeInTheDocument();
            expect(screen.getByText('Servicios')).toBeInTheDocument();

            // Check that admin links are NOT present
            expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        });
    });

    it('closes the menu when a link is clicked', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 2, nombre: 'User', role: 'USER' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        // Open menu
        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => expect(screen.getByText('Inicio')).toBeInTheDocument());

        // Click a link (e.g., 'Inicio')
        const link = screen.getByText('Inicio');
        fireEvent.click(link);

        // Wait for menu content to disappear (or verify state if we could access it, but UI check is better)
        // Since we are checking for disappearance, we wait for it to be removed/hidden.
        // NOTE: In the implementation, we use conditional rendering or CSS classes. 
        // If conditional rendering {isOpen && ...}:
        await waitFor(() => {
            // The drawer uses translate-x, so it might still be in document but hidden visually. 
            // However, the standard `createPortal(..., document.body)` with `{isOpen && ...}` means it should be removed from DOM if `isOpen` is false.
            // Let's check if the portal content is removed.

            // Checking the class change or removal is safer if we know implementation
            // Implementation: {isOpen && isClient ? createPortal(...) : null}
            // So it should be removed from DOM.
            expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
        });
    });

    it('shows profile card with correct user info', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 3, nombre: 'Carlos', role: 'USER' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);
        fireEvent.click(screen.getByRole('button', { name: /menú/i }));

        await waitFor(() => {
            expect(screen.getByText('Carlos')).toBeInTheDocument();
            expect(screen.getByText('Cliente')).toBeInTheDocument();
            expect(screen.getByText(/Mi Perfil/i)).toBeInTheDocument();
        });
    });
});
