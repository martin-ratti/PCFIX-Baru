import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

// Mock child components
vi.mock('./SalesChart', () => ({
    default: () => <div data-testid="sales-chart">Sales Chart</div>
}));

vi.mock('../../ui/feedback/ErrorBoundary', () => ({
    default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>
}));

describe('AdminDashboard', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockFetchApi = vi.mocked(fetchApi);

    const mockStats = {
        totalProducts: 150,
        lowStockProducts: 5,
        totalUsers: 1200,
        recentSales: 25,
        pendingInquiries: 3
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({
            user: { nombre: 'AdminTest', role: 'ADMIN' }
        } as any);

        // Robust mock implementation for /stats
        mockFetchApi.mockImplementation((url: string) => {
            if (url.includes('/stats')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockStats })
                } as any);
            }
            return Promise.resolve({ ok: true, json: async () => ({ success: true, data: {} }) } as any);
        });
    });

    it('renders loading state initially', () => {
        // Return a pending promise to simulate loading
        mockFetchApi.mockImplementation(() => new Promise(() => { }));
        render(<AdminDashboard />);
        expect(screen.getByText(/cargando panel/i)).toBeInTheDocument();
    });

    it('renders stats when data loaded', async () => {
        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText('150')).toBeInTheDocument(); // Products
        });

        expect(screen.getByText('5')).toBeInTheDocument(); // Low Stock
        expect(screen.getByText('25')).toBeInTheDocument(); // Sales
        expect(screen.getByText('3')).toBeInTheDocument(); // Pending Inquiries
        expect(screen.getByText(/bienvenido de nuevo, admintest/i)).toBeInTheDocument();
    });

    it('handles error state gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockFetchApi.mockRejectedValue(new Error('API Error'));

        render(<AdminDashboard />);

        await waitFor(() => {
            // Should show zeros on error (initialized in catch block)
            // But wait, the catch block sets stats to all 0s. 
            // So "0" should be present.
            // There are multiple "0"s (Total Users 0, Low Stock 0, etc).
            // We can check if ANY "0" is present.
            const zeros = screen.getAllByText('0');
            expect(zeros.length).toBeGreaterThan(0);
        });
    });

    it('renders quick action buttons', async () => {
        // Uses default mockStats
        render(<AdminDashboard />);

        await waitFor(() => {
            // Use regex and getByRole for better resilience
            expect(screen.getByRole('heading', { name: /nuevo producto/i })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /punto de venta/i })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /marketing/i })).toBeInTheDocument();
        });
    });
});
