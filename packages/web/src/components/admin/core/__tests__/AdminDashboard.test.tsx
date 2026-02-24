import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';
import { useAuthStore } from '../../../../stores/authStore';



vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));


vi.mock('../../dashboard/DashboardIntelligence', () => ({
    default: () => <div data-testid="dashboard-intelligence">Mock Dashboard Intelligence</div>
}));

describe('AdminDashboard', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({
            user: { nombre: 'AdminTest', role: 'ADMIN' }
        } as any);
    });

    it('renders welcome message and layout', () => {
        render(<AdminDashboard />);
        expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
        expect(screen.getByText('AdminTest')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-intelligence')).toBeInTheDocument();
    });

    it('renders quick action buttons', () => {
        render(<AdminDashboard />);

        
        const newProductBtn = screen.getByRole('link', { name: /nuevo producto/i });
        const posBtn = screen.getByRole('link', { name: /punto de venta/i });
        const marketingBtn = screen.getByRole('link', { name: /marketing/i });

        expect(newProductBtn).toBeInTheDocument();
        expect(newProductBtn).toHaveAttribute('href', '/admin/nuevo');

        expect(posBtn).toBeInTheDocument();
        expect(posBtn).toHaveAttribute('href', '/admin/nueva-venta');

        expect(marketingBtn).toBeInTheDocument();
        expect(marketingBtn).toHaveAttribute('href', '/admin/marcas');
    });
});
