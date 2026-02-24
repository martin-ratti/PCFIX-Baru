import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileMenu from '../MobileMenu';
import { useAuthStore } from '../../../../stores/authStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));


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

        
        fireEvent.click(screen.getByRole('button', { name: /menú/i }));

        await waitFor(() => {
            
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
            expect(screen.getByText(/Ventas/i)).toBeInTheDocument();
            expect(screen.getByText(/Productos/i)).toBeInTheDocument();
            expect(screen.getByText(/Configuración/i)).toBeInTheDocument();

            
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

        
        fireEvent.click(screen.getByRole('button', { name: /menú/i }));

        await waitFor(() => {
            
            expect(screen.getByText('Inicio')).toBeInTheDocument();
            expect(screen.getByText('Productos')).toBeInTheDocument();
            expect(screen.getByText('Servicios')).toBeInTheDocument();

            
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

        
        const hamburger = screen.getByRole('button', { name: /menú/i });
        fireEvent.click(hamburger);

        await waitFor(() => expect(screen.getByText('Inicio')).toBeInTheDocument());

        
        const link = screen.getByText('Inicio');
        fireEvent.click(link);

        
        
        
        
        await waitFor(() => {
            
            
            

            
            
            
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
