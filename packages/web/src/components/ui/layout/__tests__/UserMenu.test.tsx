import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserMenu from '../UserMenu';
import { useAuthStore } from '../../../../stores/authStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('UserMenu', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true
        });
    });

    it('shows login/register buttons when not authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: false,
            user: null,
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByRole('link', { name: /ingresar/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /registrarse/i })).toBeInTheDocument();
        });
    });

    it('shows user avatar button when authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 1, nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com', role: 'USER' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            
            expect(screen.getByText('J')).toBeInTheDocument();
        });
    });

    it('opens dropdown on avatar click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 1, nombre: 'Juan', apellido: 'Perez', email: 'juan@test.com', role: 'USER' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByText('J')).toBeInTheDocument();
        });

        const avatarButton = screen.getByText('J').closest('button');
        fireEvent.click(avatarButton!);

        await waitFor(() => {
            expect(screen.getByText('juan@test.com')).toBeInTheDocument();
            expect(screen.getByText(/mi perfil/i)).toBeInTheDocument();
        });
    });

    it('shows admin badge for admin users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 1, nombre: 'Admin', apellido: 'User', email: 'admin@test.com', role: 'ADMIN' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByText(/administrador/i)).toBeInTheDocument();
        });
    });

    it('shows user-specific links for regular users', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 5, nombre: 'User', apellido: 'Test', email: 'user@test.com', role: 'USER' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByText('U')).toBeInTheDocument();
        });

        const avatarButton = screen.getByText('U').closest('button');
        fireEvent.click(avatarButton!);

        await waitFor(() => {
            expect(screen.getByText(/mis compras/i)).toBeInTheDocument();
            expect(screen.getByText(/mis consultas/i)).toBeInTheDocument();
            expect(screen.getByText(/favoritos/i)).toBeInTheDocument();
        });
    });

    it('calls logout and redirects on logout click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 1, nombre: 'User', apellido: 'Test', email: 'user@test.com', role: 'USER' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByText('U')).toBeInTheDocument();
        });

        const avatarButton = screen.getByText('U').closest('button');
        fireEvent.click(avatarButton!);

        await waitFor(() => {
            expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/cerrar sesión/i));

        expect(mockLogout).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
    });

    it('links to correct profile page', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            isAuthenticated: true,
            user: { id: 42, nombre: 'Test', apellido: 'User', email: 'test@test.com', role: 'USER' },
            logout: mockLogout
        } as any);

        render(<UserMenu />);

        await waitFor(() => {
            expect(screen.getByText('T')).toBeInTheDocument();
        });

        const avatarButton = screen.getByText('T').closest('button');
        fireEvent.click(avatarButton!);

        await waitFor(() => {
            const profileLink = screen.getByRole('link', { name: /mi perfil/i });
            expect(profileLink).toHaveAttribute('href', '/cuenta/perfil/42');
        });
    });
});
