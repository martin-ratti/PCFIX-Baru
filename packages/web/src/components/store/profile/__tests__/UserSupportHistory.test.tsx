import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserSupportHistory from '../UserSupportHistory';
import { useAuthStore } from '../../../../stores/authStore';
import * as apiUtils from '../../../../utils/api';


vi.mock('../../../../stores/authStore');
vi.mock('../../../../utils/api');

describe('UserSupportHistory', () => {
    const mockUser = { id: 1, nombre: 'Test User' };
    const mockToken = 'test-token';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockReturnValue({ user: null, token: null } as any);
    });

    it('should fetch and display inquiries when logged in', async () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: mockUser, token: mockToken } as any);

        const mockInquiries = [
            { id: 1, asunto: 'Test Issue', mensaje: 'Help', estado: 'PENDIENTE', createdAt: new Date().toISOString() }
        ];

        vi.mocked(apiUtils.fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockInquiries })
        } as any);

        render(<UserSupportHistory />);

        expect(screen.getByText(/Cargando historial/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test Issue')).toBeInTheDocument();
            expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
        });
    });

    it('should display replies when available', async () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: mockUser, token: mockToken } as any);

        const mockInquiries = [
            {
                id: 1,
                asunto: 'Resolved Issue',
                mensaje: 'Help',
                estado: 'RESPONDIDO',
                respuesta: 'Fixed',
                createdAt: new Date().toISOString()
            }
        ];

        vi.mocked(apiUtils.fetchApi).mockResolvedValue({
            json: async () => ({ success: true, data: mockInquiries })
        } as any);

        render(<UserSupportHistory />);

        await waitFor(() => {
            expect(screen.getByText('Respuesta de PCFIX:')).toBeInTheDocument();
            expect(screen.getByText('Fixed')).toBeInTheDocument();
        });
    });

    it('should return null if user not logged in', () => {
        vi.mocked(useAuthStore).mockReturnValue({ user: null, token: null } as any);
        const { container } = render(<UserSupportHistory />);
        expect(container).toBeEmptyDOMElement();
    });
});
