import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLinks from '../AdminLinks';
import { useAuthStore } from '../../../../stores/authStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));


vi.mock('../../../store/profile/ServicePriceModal', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="service-price-modal">{children}</div>
}));

describe('AdminLinks', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when user is not admin', () => {
        mockUseAuthStore.mockReturnValue({ user: { role: 'USER' } } as any);
        const { container } = render(<AdminLinks />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when user is null', () => {
        mockUseAuthStore.mockReturnValue({ user: null } as any);
        const { container } = render(<AdminLinks />);
        expect(container.firstChild).toBeNull();
    });

    it('renders admin navigation links when user is admin', () => {
        mockUseAuthStore.mockReturnValue({ user: { role: 'ADMIN' } } as any);
        render(<AdminLinks />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Inventario')).toBeInTheDocument();
        expect(screen.getByText('Categorías')).toBeInTheDocument();
        expect(screen.getByText('Marketing')).toBeInTheDocument();
        expect(screen.getByText('Soporte')).toBeInTheDocument();
    });

    it('renders correct href for navigation links', () => {
        mockUseAuthStore.mockReturnValue({ user: { role: 'ADMIN' } } as any);
        render(<AdminLinks />);

        expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/admin');
        expect(screen.getByText('Inventario').closest('a')).toHaveAttribute('href', '/admin/productos');
        expect(screen.getByText('Categorías').closest('a')).toHaveAttribute('href', '/admin/categorias');
    });

    it('renders tool buttons', () => {
        mockUseAuthStore.mockReturnValue({ user: { role: 'ADMIN' } } as any);
        render(<AdminLinks />);

        expect(screen.getByText('Tarifas')).toBeInTheDocument();
        expect(screen.getByText('Config')).toBeInTheDocument();
    });

    it('renders configuration link with correct href', () => {
        mockUseAuthStore.mockReturnValue({ user: { role: 'ADMIN' } } as any);
        render(<AdminLinks />);

        const configLink = screen.getByText('Config').closest('a');
        expect(configLink).toHaveAttribute('href', '/admin/configuracion');
    });
});
