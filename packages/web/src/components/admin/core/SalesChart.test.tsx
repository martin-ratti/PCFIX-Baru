import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SalesChart from './SalesChart';
import { useAuthStore } from '../../../stores/authStore';

// Mock dependencies
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
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

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state when no token', () => {
        mockUseAuthStore.mockReturnValue({ token: null } as any);
        render(<SalesChart />);
        // Should render loading placeholder
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders chart container', () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        render(<SalesChart />);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays title', () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        render(<SalesChart />);
        expect(screen.getByText('Balance de Ingresos')).toBeInTheDocument();
    });

    it('displays year selector', () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        render(<SalesChart />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows products and services labels', () => {
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        render(<SalesChart />);
        expect(screen.getByText('Productos:')).toBeInTheDocument();
        expect(screen.getByText('Servicios:')).toBeInTheDocument();
    });
});
