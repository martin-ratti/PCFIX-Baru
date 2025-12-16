import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditProductForm from '../EditProductForm';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
    API_URL: 'http://local-test-api'
}));

// Mock navigate
vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

describe('EditProductForm', () => {
    const mockUseAuthStore = vi.mocked(useAuthStore);
    const mockAddToast = vi.fn();

    const mockProduct = {
        id: 1,
        nombre: 'Producto Existente',
        descripcion: 'Descripción válida y larga para pasar validación',
        precio: 1500,
        stock: 5,
        categoriaId: 1,
        marcaId: 1,
        peso: 1,
        alto: 10,
        ancho: 10,
        profundidad: 10,
        especificaciones: {}
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        global.fetch = vi.fn((url: any, options: any) => {
            const urlStr = url.toString();
            if (urlStr.includes('/products/1') && options?.method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockProduct })
                });
            }
            if (urlStr.includes('/products/1')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockProduct })
                });
            }
            if (urlStr.includes('/categories')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Categoria 1' }] })
                });
            }
            if (urlStr.includes('/brands')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Marca 1' }] })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({ success: true, data: {} }) });
        }) as any;
    });

    it('loads and displays existing product data', async () => {
        render(<EditProductForm productId="1" />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('Producto Existente')).toBeInTheDocument();
        });
    });

    it('submits updated data', async () => {
        render(<EditProductForm productId="1" />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Producto Existente')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'Producto Modificado' } });

        const submitBtn = screen.getByText(/guardar cambios/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // Check calling global.fetch.
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/products/1'), expect.objectContaining({ method: 'PUT' }));
            expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('actualizado'), 'success');
        });
    });
});
