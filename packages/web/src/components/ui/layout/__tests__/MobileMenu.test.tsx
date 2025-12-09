import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileMenu from './MobileMenu';
import { useAuthStore } from '../../../stores/authStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
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

    it('opens menu on hamburger click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /menú/i })).toBeInTheDocument();
        });

        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => {
            expect(screen.getByText('Inicio')).toBeInTheDocument();
        });
    });

    it('shows login buttons when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /ingresar/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /registrarse/i })).toBeInTheDocument();
        });
    });

    it('shows user info when authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Juan', role: 'USER' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => {
            expect(screen.getByText('Juan')).toBeInTheDocument();
            expect(screen.getByText('Cliente')).toBeInTheDocument();
        });
    });

    it('shows admin panel link for admin users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => {
            expect(screen.getByText('Administrador')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /panel admin/i })).toBeInTheDocument();
        });
    });

    it('calls logout and redirects on logout click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' },
            isAuthenticated: true,
            logout: mockLogout
        } as any);

        render(<MobileMenu />);

        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => {
            expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/cerrar sesión/i));

        expect(mockLogout).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
    });
});
