import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BrandManager from '../BrandManager';
import { useToastStore } from '../../../../stores/toastStore';
import { fetchApi } from '../../../../utils/api';

// Mocks
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

describe('BrandManager', () => {
    const mockAddToast = vi.fn();
    const mockFetchApi = vi.mocked(fetchApi);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/brands')) {
                if (url.includes('DELETE')) return Promise.resolve({ json: async () => ({ success: true }) });
                if (url.includes('POST')) return Promise.resolve({ json: async () => ({ success: true }) });
                return Promise.resolve({
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Brand 1', logo: 'logo.png' }] })
                });
            }
            return Promise.resolve({ json: async () => ({ success: true }) });
        });
    });

    it('renders form and lists existing brands', async () => {
        render(<BrandManager />);

        await waitFor(() => {
            expect(screen.getByText('Brand 1')).toBeInTheDocument();
            expect(screen.getByRole('img')).toHaveAttribute('src', 'logo.png');
        });
    });

    it('submits new brand', async () => {
        render(<BrandManager />);

        fireEvent.change(screen.getByPlaceholderText(/ej: logitech/i), { target: { value: 'New Brand' } });

        const submitBtn = screen.getByText(/crear marca/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/brands', expect.objectContaining({ method: 'POST' }));
            expect(mockAddToast).toHaveBeenCalledWith('Marca creada', 'success');
        });
    });

    it('opens delete modal and confirms deletion', async () => {
        render(<BrandManager />);

        await waitFor(() => expect(screen.getByText('Brand 1')).toBeInTheDocument());

        // Find delete button for the brand
        const deleteButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('<path'));
        if (deleteButton) fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm Delete'));

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/brands/1', expect.objectContaining({ method: 'DELETE' }));
            expect(mockAddToast).toHaveBeenCalledWith('Marca eliminada', 'success');
        });
    });
});
