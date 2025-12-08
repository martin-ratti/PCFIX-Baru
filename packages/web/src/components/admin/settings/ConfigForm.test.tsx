import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ConfigForm from './ConfigForm';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

// Mocks
vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

describe('ConfigForm', () => {
    const mockAddToast = vi.fn();
    const mockFetchApi = vi.mocked(fetchApi);
    const mockUseAuthStore = vi.mocked(useAuthStore);

    const mockConfig = {
        nombreBanco: 'Test Bank',
        titular: 'Test User',
        cbu: '123456789',
        alias: 'test.alias',
        cotizacionUsdt: 1000
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);

        mockFetchApi.mockResolvedValue({
            json: async () => ({ success: true, data: mockConfig })
        } as any);
    });

    it('loads and displays existing config values', async () => {
        render(<ConfigForm />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
        });
    });

    it('displays CBU value', async () => {
        render(<ConfigForm />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
        });
    });

    it('displays cotizacion USDT value', async () => {
        render(<ConfigForm />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
        });
    });
});
