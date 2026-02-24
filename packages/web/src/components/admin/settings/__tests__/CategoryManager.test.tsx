import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CategoryManager from '../CategoryManager';
import { useToastStore } from '../../../../stores/toastStore';
import { fetchApi } from '../../../../utils/api';


vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('../../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
            <button onClick={onCancel}>Cancel Delete</button>
        </div>
    ) : null
}));

describe('CategoryManager', () => {
    const mockAddToast = vi.fn();
    const mockFetchApi = vi.mocked(fetchApi);

    const mockCategories = [
        {
            id: 1,
            nombre: 'Parent Cat',
            subcategorias: [{ id: 2, nombre: 'Child Cat' }]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/categories')) {
                if (url.includes('DELETE')) return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
                if (url.includes('POST')) return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
                if (url.includes('flat=true')) return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [{ id: 1, nombre: 'Parent Cat' }] }) } as Response);
                return Promise.resolve({ ok: true, json: async () => ({ success: true, data: mockCategories }) } as Response);
            }
            return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
        });
    });

    it('renders form and category tree', async () => {
        render(<CategoryManager />);

        await waitFor(() => {
            expect(screen.getByText('Parent Cat')).toBeInTheDocument();
            expect(screen.getByText('Child Cat')).toBeInTheDocument();
        });

        
        expect(screen.getByText('Parent Cat', { selector: 'option' })).toBeInTheDocument();
    });

    it('submits new category', async () => {
        render(<CategoryManager />);

        fireEvent.change(screen.getByPlaceholderText(/ej: periféricos/i), { target: { value: 'New Category' } });

        const submitBtn = screen.getByText('Crear');
        fireEvent.click(submitBtn);

        
        await waitFor(() => {
            expect(screen.getByText(/creando/i)).toBeInTheDocument();
            expect(submitBtn).toBeDisabled();
        });

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/categories', expect.objectContaining({ method: 'POST' }));
            expect(mockAddToast).toHaveBeenCalledWith('Categoría creada', 'success');
        });
    });

    it('opens delete modal and confirms deletion', async () => {
        render(<CategoryManager />);

        await waitFor(() => expect(screen.getByText('Parent Cat')).toBeInTheDocument());

        
        const deleteBtns = screen.getAllByText('Eliminar');
        fireEvent.click(deleteBtns[0]);

        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm Delete'));

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/categories/1', expect.objectContaining({ method: 'DELETE' }));
            expect(mockAddToast).toHaveBeenCalledWith('Categoría eliminada', 'success');
        });
    });
});
