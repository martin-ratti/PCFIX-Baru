import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardIntelligence from '../DashboardIntelligence';
import { useAuthStore } from '../../../../stores/authStore';
import { fetchApi } from '../../../../utils/api';

// Mock dependencies
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

// Mock Recharts
vi.mock('recharts', () => ({
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div data-testid="area" />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('DashboardIntelligence', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockFetchApi = vi.mocked(fetchApi);

    const mockData = {
        kpis: {
            grossRevenue: 100000,
            lowStockProducts: 12,
            pendingReview: 3,
            pendingSupport: 5
        },
        charts: {
            salesTrend: [{ date: '2024-01-01', total: 10000, count: 2 }],
            topProducts: [{ name: 'GPU RTX 3060', quantity: 10 }]
        },
        deadStock: [
            { id: 1, name: 'Old GPU', stock: 2, price: 50000, lastSale: '2023-01-01', daysInactive: 120 }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        mockUseAuthStore.mockReturnValue({ token: 'test' } as any);
        mockFetchApi.mockReturnValue(new Promise(() => { })); // Never resolves
        render(<DashboardIntelligence />);
        expect(screen.getByText(/Analizando datos comerciales/i)).toBeInTheDocument();
    });

    it('renders KPIs and charts when data loads', async () => {
        mockUseAuthStore.mockReturnValue({ token: 'test' } as any);
        mockFetchApi.mockResolvedValue({
            json: async () => ({ success: true, data: mockData })
        } as any);

        render(<DashboardIntelligence />);

        await waitFor(() => {
            expect(screen.getByText(/Inteligencia de Ventas/i)).toBeInTheDocument();
        });

        // KPIs
        expect(screen.getByText('$ 100.000')).toBeInTheDocument(); // Gross Revenue
        expect(screen.getByText('12')).toBeInTheDocument(); // Low Stock
        expect(screen.getByText('3')).toBeInTheDocument(); // Pending Review
        expect(screen.getByText('5')).toBeInTheDocument(); // Pending Support

        // Charts
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

        // Dead Stock
        expect(screen.getByText('Old GPU')).toBeInTheDocument();
        expect(screen.getByText('120 días')).toBeInTheDocument();
    });

    it('handles empty dead stock gracefully', async () => {
        mockUseAuthStore.mockReturnValue({ token: 'test' } as any);
        const emptyStockData = { ...mockData, deadStock: [] };

        mockFetchApi.mockResolvedValue({
            json: async () => ({ success: true, data: emptyStockData })
        } as any);

        render(<DashboardIntelligence />);

        await waitFor(() => {
            expect(screen.getByText(/¡Excelente! No tienes stock muerto/i)).toBeInTheDocument();
        });
    });
});
