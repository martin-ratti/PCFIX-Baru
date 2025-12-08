import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        vi.mocked(useToastStore).mockReturnValue(mockAddToast);
        mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);

        mockFetchApi.mockImplementation((url) => {
            if (url.includes('/config')) {
                if (url.includes('PUT')) return Promise.resolve({ json: async () => ({ success: true }) });
                return Promise.resolve({ json: async () => ({ success: true, data: mockConfig }) });
            }
            if (url.includes('crypto')) {
                return Promise.resolve({ json: async () => ({ ask: 1200 }) });
            }
            return Promise.resolve({ json: async () => ({ success: true }) });
        });
    });

    it('loads and displays existing config', async () => {
        render(<ConfigForm />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
            expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
        });
    });

    it('submits updated config', async () => {
        render(<ConfigForm />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/nombre del banco/i), { target: { value: 'New Bank' } });

        const submitBtn = screen.getByText(/guardar configuración/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetchApi).toHaveBeenCalledWith('/config', expect.objectContaining({ method: 'PUT' }));
            expect(mockAddToast).toHaveBeenCalledWith('Configuración actualizada', 'success');
        });
        import { describe, it, expect, vi, beforeEach } from 'vitest';
        import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
                vi.mocked(useToastStore).mockReturnValue(mockAddToast);
                mockUseAuthStore.mockReturnValue({ token: 'test-token' } as any);

                mockFetchApi.mockImplementation((url) => {
                    if (url.includes('/config')) {
                        if (url.includes('PUT')) return Promise.resolve({ json: async () => ({ success: true }) });
                        return Promise.resolve({ json: async () => ({ success: true, data: mockConfig }) });
                    }
                    if (url.includes('crypto')) {
                        return Promise.resolve({ json: async () => ({ ask: 1200 }) });
                    }
                    return Promise.resolve({ json: async () => ({ success: true }) });
                });
            });

            it('loads and displays existing config', async () => {
                render(<ConfigForm />);

                await waitFor(() => {
                    expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
                    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
                    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
                });
            });

            it('submits updated config', async () => {
                render(<ConfigForm />);

                await waitFor(() => {
                    expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
                });

                fireEvent.change(screen.getByLabelText(/nombre del banco/i), { target: { value: 'New Bank' } });

                const submitBtn = screen.getByText(/guardar configuración/i);
                fireEvent.click(submitBtn);

                await waitFor(() => {
                    expect(mockFetchApi).toHaveBeenCalledWith('/config', expect.objectContaining({ method: 'PUT' }));
                    expect(mockAddToast).toHaveBeenCalledWith('Configuración actualizada', 'success');
                });
            });

            it('syncs USDT price when button is clicked', async () => {
                render(<ConfigForm />);

                await waitFor(() => {
                    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
                });

                // Find sync button
                const syncBtn = screen.getByTitle('Obtiene el precio de venta P2P actual');
                fireEvent.click(syncBtn);

                await waitFor(() => {
                    expect(screen.getByDisplayValue('1200')).toBeInTheDocument();
                    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Cotización actualizada'), 'success');
                });
            });
        });
