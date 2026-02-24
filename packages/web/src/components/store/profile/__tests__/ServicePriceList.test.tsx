import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServicePriceList from '../ServicePriceList';
import { useServiceStore } from '../../../../stores/serviceStore';


vi.mock('../../../../stores/serviceStore', () => ({
    useServiceStore: vi.fn()
}));

describe('ServicePriceList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading skeleton when loading with no items', () => {
        vi.mocked(useServiceStore).mockReturnValue({
            items: [],
            isLoading: true,
            fetchItems: vi.fn()
        } as any);

        render(<ServicePriceList />);

        
        expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
    });

    it('renders service items from store', async () => {
        const mockItems = [
            { id: 1, title: 'Limpieza de PC', price: 5000, description: 'Limpieza completa' },
            { id: 2, title: 'Formateo', price: 8000, description: 'Instalación de Windows' },
            { id: 3, title: 'Upgrade', price: 3000, description: 'Instalación de componentes' }
        ];

        vi.mocked(useServiceStore).mockReturnValue({
            items: mockItems,
            isLoading: false,
            fetchItems: vi.fn()
        } as any);

        render(<ServicePriceList />);

        expect(screen.getByText('Limpieza de PC')).toBeInTheDocument();
        expect(screen.getByText('Formateo')).toBeInTheDocument();
        expect(screen.getByText('Upgrade')).toBeInTheDocument();
    });

    it('displays prices in Argentine format', async () => {
        const mockItems = [
            { id: 1, title: 'Servicio', price: 15000, description: 'Test' }
        ];

        vi.mocked(useServiceStore).mockReturnValue({
            items: mockItems,
            isLoading: false,
            fetchItems: vi.fn()
        } as any);

        render(<ServicePriceList />);

        
        expect(screen.getByText(/15\.000|15,000/)).toBeInTheDocument();
    });

    it('calls fetchItems on mount', () => {
        const mockFetchItems = vi.fn();

        vi.mocked(useServiceStore).mockReturnValue({
            items: [],
            isLoading: true,
            fetchItems: mockFetchItems
        } as any);

        render(<ServicePriceList />);

        expect(mockFetchItems).toHaveBeenCalled();
    });

    it('displays descriptions for each service', () => {
        const mockItems = [
            { id: 1, title: 'Servicio', price: 5000, description: 'Descripción detallada del servicio' }
        ];

        vi.mocked(useServiceStore).mockReturnValue({
            items: mockItems,
            isLoading: false,
            fetchItems: vi.fn()
        } as any);

        render(<ServicePriceList />);

        expect(screen.getByText('Descripción detallada del servicio')).toBeInTheDocument();
    });
});
