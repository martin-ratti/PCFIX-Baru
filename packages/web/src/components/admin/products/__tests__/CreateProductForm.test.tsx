import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CreateProductForm from './CreateProductForm';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

describe('CreateProductForm', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockAddToast = vi.fn();
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        // STUB GLOBAL FETCH
        global.fetch = mockFetch;

        mockFetch.mockImplementation((url: string | URL) => {
            const urlStr = url.toString();
            console.log('MockFetch called:', urlStr);

            if (urlStr.includes('/categories')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Categoria 1' }] })
                } as Response);
            }
            if (urlStr.includes('/brands')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Marca 1' }] })
                } as Response);
            }
            if (urlStr.includes('/products')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: { id: 100 } })
                } as Response);
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true })
            } as Response);
        });
    });

    it('renders form elements', async () => {
        render(<CreateProductForm />);
        await waitFor(() => {
            expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
            expect(screen.getByTestId('input-precio')).toBeInTheDocument();
        });
    });

    it('validates required fields', async () => {
        render(<CreateProductForm />);
        const submitBtn = screen.getByText(/crear producto/i);
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(screen.getByText(/nombre muy corto/i)).toBeInTheDocument();
        });
    });

    it('submits valid form data', async () => {
        render(<CreateProductForm />);

        await waitFor(() => {
            expect(screen.getByText('Categoria 1')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'Nuevo Producto' } });
        fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Descripcion valida para producto' } });
        fireEvent.change(screen.getByTestId('input-precio'), { target: { value: '1000' } });
        fireEvent.change(screen.getByTestId('input-stock'), { target: { value: '10' } });

        // Selects
        fireEvent.change(screen.getByTestId('select-category'), { target: { value: '1' } });
        fireEvent.change(screen.getByTestId('select-brand'), { target: { value: '1' } });

        // Dimensions
        fireEvent.change(screen.getByTestId('input-peso'), { target: { value: '0.5' } });
        fireEvent.change(screen.getByTestId('input-alto'), { target: { value: '10' } });
        fireEvent.change(screen.getByTestId('input-ancho'), { target: { value: '10' } });
        fireEvent.change(screen.getByTestId('input-prof'), { target: { value: '10' } });

        const submitBtn = screen.getByText(/crear producto/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/products'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });
});
