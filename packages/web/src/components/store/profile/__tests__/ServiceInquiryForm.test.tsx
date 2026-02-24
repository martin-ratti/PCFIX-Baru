import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceInquiryForm from '../ServiceInquiryForm';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

import { fetchApi } from '../../../../utils/api';

describe('ServiceInquiryForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('renders form with subject select and message textarea', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User' },
            token: 'test-token'
        } as any);

        render(<ServiceInquiryForm />);

        expect(screen.getByText('Asunto')).toBeInTheDocument();
        expect(screen.getByText('Detalle del Problema')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar consulta/i })).toBeInTheDocument();
    });

    it('shows error toast for empty message', async () => {
        const addToastMock = vi.fn();
        vi.mocked(useToastStore).mockImplementation(((selector: any) => {
            if (selector) return addToastMock; 
            return { getState: () => ({ addToast: addToastMock }) }; 
        }) as any);
        
        
        

        
        const addToast = vi.fn();
        vi.mocked(useToastStore).mockReturnValue({
            getState: () => ({ addToast })
        } as any);
        
        
        
        
        
        

        
        
        

        
        

        

        
        

        vi.mocked(useToastStore).mockReturnValue({} as any);
        vi.mocked(useToastStore).getState = vi.fn().mockReturnValue({ addToast });

        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User' },
            token: 'test-token'
        } as any);

        render(<ServiceInquiryForm />);

        const submitBtn = screen.getByRole('button', { name: /enviar consulta/i });
        fireEvent.click(submitBtn);

        expect(addToast).toHaveBeenCalledWith(
            expect.stringContaining('detalla tu problema'),
            'error'
        );
    });

    it('stores form and shows info toast if not authenticated', async () => {
        const addToast = vi.fn();
        vi.mocked(useToastStore).getState = vi.fn().mockReturnValue({ addToast });

        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            token: null
        } as any);

        render(<ServiceInquiryForm />);

        const textarea = screen.getByPlaceholderText(/hola, tengo una pc/i);
        fireEvent.change(textarea, { target: { value: 'Mi PC no enciende' } });

        const submitBtn = screen.getByRole('button', { name: /enviar consulta/i });
        fireEvent.click(submitBtn);

        expect(addToast).toHaveBeenCalledWith(
            expect.stringContaining('iniciar sesión'),
            'info'
        );

        
        expect(sessionStorage.getItem('pendingInquiry')).toBeTruthy();
    });

    it('submits form successfully', async () => {
        const addToast = vi.fn();
        vi.mocked(useToastStore).getState = vi.fn().mockReturnValue({ addToast });

        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'User' },
            token: 'test-token'
        } as any);

        vi.mocked(fetchApi).mockResolvedValue({
            json: async () => ({ success: true })
        } as any);

        render(<ServiceInquiryForm />);

        const textarea = screen.getByPlaceholderText(/hola, tengo una pc/i);
        fireEvent.change(textarea, { target: { value: 'Mi PC hace ruido' } });

        const submitBtn = screen.getByRole('button', { name: /enviar consulta/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(addToast).toHaveBeenCalledWith(
                expect.stringContaining('Consulta recibida'),
                'success'
            );
        });
    });

    it('shows info message for non-authenticated users', () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            token: null
        } as any);

        render(<ServiceInquiryForm />);

        expect(screen.getByText(/se te pedirá iniciar sesión/i)).toBeInTheDocument();
    });
});
