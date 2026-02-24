import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServicePriceModal from '../ServicePriceModal';
import { useAuthStore } from '../../../../stores/authStore';
import { useServiceStore } from '../../../../stores/serviceStore';
import { useToastStore } from '../../../../stores/toastStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/serviceStore', () => ({
    useServiceStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));



describe('ServicePriceModal', () => {
    const mockAddToast = vi.fn();
    const mockFetchItems = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });

        vi.mocked(useServiceStore).mockReturnValue({
            items: [
                { id: 1, title: 'Limpieza', price: 5000 },
                { id: 2, title: 'Formateo', price: 8000 }
            ],
            fetchItems: mockFetchItems
        } as any);

        
        (useServiceStore as any).getState = () => ({
            items: [
                { id: 1, title: 'Limpieza', price: 5000 },
                { id: 2, title: 'Formateo', price: 8000 }
            ]
        });
    });

    it('returns null for non-admin users', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User', role: 'USER' },
            token: 'test-token'
        } as any);

        const { container } = render(<ServicePriceModal />);

        expect(container.firstChild).toBeNull();
    });

    it('returns null when not authenticated', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            token: null
        } as any);

        const { container } = render(<ServicePriceModal />);

        expect(container.firstChild).toBeNull();
    });

    it('renders trigger button for admin users', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            token: 'test-token'
        } as any);

        render(<ServicePriceModal />);

        expect(screen.getByText('Tarifas')).toBeInTheDocument();
    });

    it('opens modal on trigger click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            token: 'test-token'
        } as any);

        render(<ServicePriceModal />);

        const trigger = screen.getByText('Tarifas');
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByText('Precios de Servicios')).toBeInTheDocument();
        });
    });

    it('renders custom children as trigger', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            token: 'test-token'
        } as any);

        render(
            <ServicePriceModal>
                <button>Custom Trigger</button>
            </ServicePriceModal>
        );

        expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
    });

    it('closes modal on cancel button click', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Admin', role: 'ADMIN' },
            token: 'test-token'
        } as any);

        render(<ServicePriceModal />);

        fireEvent.click(screen.getByText('Tarifas'));

        await waitFor(() => {
            expect(screen.getByText('Precios de Servicios')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() => {
            expect(screen.queryByText('Precios de Servicios')).not.toBeInTheDocument();
        });
    });
});
