import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BannerManager from './BannerManager';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';

// Mocks
vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('../../ui/feedback/ConfirmModal', () => ({
    default: ({ isOpen, onConfirm, onCancel }: any) => isOpen ? (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
            <button onClick={onCancel}>Cancel Delete</button>
        </div>
    ) : null
}));

describe('BannerManager', () => {
    const mockAddToast = vi.fn();
    const mockFetchApi = vi.mocked(fetchApi);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);

        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/brands')) {
                return Promise.resolve({
                    json: async () => ({ success: true, data: [{ id: 1, nombre: 'Brand 1' }] })
                });
            }
            if (url.includes('/banners')) {
                if (url.includes('DELETE')) return Promise.resolve({ json: async () => ({ success: true }) });
                return Promise.resolve({
                    json: async () => ({ success: true, data: [{ id: 1, imagen: 'img.jpg', marca: { id: 1, nombre: 'Brand 1' } }] })
                });
            }
            return Promise.resolve({ json: async () => ({ success: true }) });
        });
    });

    it('renders form and lists existing banners', async () => {
        render(<BannerManager />);

        await waitFor(() => {
            // "Brand 1" appears in option and in banner list, so we expect at least one occurrence
            const elements = screen.getAllByText('Brand 1');
            expect(elements.length).toBeGreaterThan(0);
            expect(screen.getAllByRole('img')).toHaveLength(1);
        });
    });

    it('validates required fields', async () => {
        render(<BannerManager />);

        const submitBtn = screen.getByText(/publicar banner/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getAllByText(/requerido/i)).toHaveLength(2); // Brand + Image
        });
    });

    it('opens delete modal and confirms deletion', async () => {
        render(<BannerManager />);

        await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));

        // Find delete button based on svg path usage (common pattern for icon buttons without text)
        // or getting all buttons and filtering by those that are likely delete buttons (inside the list)

        const buttons = screen.getAllByRole('button');
        // The delete button is the one with the trash icon (or similar X icon)
        // In the code it uses d="M6 18L18 6M6 6l12 12" which is an X.
        const deleteButton = buttons.find(b => b.innerHTML.includes('d="M6 18L18 6M6 6l12 12"'));

        if (deleteButton) fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm Delete'));

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/banners/1', expect.objectContaining({ method: 'DELETE' }));
            expect(mockAddToast).toHaveBeenCalledWith('Banner eliminado', 'success');
        });
    });
});
