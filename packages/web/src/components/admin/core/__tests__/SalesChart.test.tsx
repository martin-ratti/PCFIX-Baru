import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SalesChart from '../SalesChart';
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

// Mock Recharts components since they need browser environment
vi.mock('recharts', () => ({
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    Legend: () => <div />,
}));

describe('SalesChart', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockFetchApi = vi.mocked(fetchApi);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading placeholder when no data', () => {
        mockUseAuthStore.mockReturnValue({ token: null } as any);
        const { container } = render(<SalesChart />);
        // When loading with no data, shows animate-pulse placeholder
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders chart when data loads', async () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        mockFetchApi.mockResolvedValue({
            json: async () => ({
                success: true,
                data: [
                    { name: 'Ene', monthIndex: 1, products: 50000, services: 25000 }
                ]
            })
        } as any);

        render(<SalesChart />);

        await waitFor(() => {
            expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        });
    });

    it('displays title when data loaded', async () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        mockFetchApi.mockResolvedValue({
            json: async () => ({
                success: true,
                data: [{ name: 'Ene', monthIndex: 1, products: 50000, services: 25000 }]
            })
        } as any);

        render(<SalesChart />);

        await waitFor(() => {
            expect(screen.getByText('Balance de Ingresos')).toBeInTheDocument();
        });
    });

    it('displays year selector', async () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        mockFetchApi.mockResolvedValue({
            json: async () => ({
                success: true,
                data: [{ name: 'Ene', monthIndex: 1, products: 50000, services: 25000 }]
            })
        } as any);

        render(<SalesChart />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
    });
});
