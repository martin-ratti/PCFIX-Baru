import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceInquiryForm from '../ServiceInquiryForm';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';

// Mocks
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
            if (selector) return addToastMock; // selector is (state) => state.addToast
            return { getState: () => ({ addToast: addToastMock }) }; // partial store mock
        }) as any);
        // Also mock getState explicitly if needed, but for custom hooks usually the selector is enough or the store itself.
        // Actually, looking at the component: `useToastStore.getState().addToast(...)`
        // So we need to mock the implementation of useToastStore to have a getState method.

        // Let's refine the mock strategy efficiently:
        const addToast = vi.fn();
        vi.mocked(useToastStore).mockReturnValue({
            getState: () => ({ addToast })
        } as any);
        // AND handle the hook usage `useToastStore((state) => state.addToast)`? 
        // No, the component was refactored to use `useToastStore.getState().addToast` in some places? 
        // Wait, looking at the previous diff:
        // +      useToastStore.getState().addToast('Por favor detalla tu problema...','error');
        // AND
        // +    const addToast = useToastStore((state) => state.addToast);

        // Wait, I need to check the component code again to be sure if it mixes access patterns.
        // Step 845 diff showed:
        // +      useToastStore.getState().addToast(...)

        // Step 851 (ContactForm) showed:
        // +    const addToast = useToastStore((state) => state.addToast);

        // ServiceInquiryForm (Step 845/846/847) seemed to use `getState().addToast` for the validation error.

        // Let's assume `useToastStore` mock needs to support both or I should verify the component first.
        // To be safe I'll assume `getState` usage. 

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

        // Check sessionStorage has pending inquiry
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
