
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordModal from '../ForgotPasswordModal';
import { useToastStore } from '../../../../stores/toastStore';


vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

describe('ForgotPasswordModal', () => {
    const mockAddToast = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });

        global.fetch = vi.fn();
    });

    it('does not render when isOpen is false', () => {
        render(<ForgotPasswordModal isOpen={false} onClose={mockOnClose} />);
        expect(screen.queryByText('Recuperar Contraseña')).toBeNull();
    });

    it('renders correctly when isOpen is true', () => {
        render(<ForgotPasswordModal isOpen={true} onClose={mockOnClose} />);
        expect(screen.getByText('Recuperar Contraseña')).toBeDefined();
        expect(screen.getByPlaceholderText('tu@email.com')).toBeDefined();
    });

    it('calls onClose when close button clicked', () => {
        render(<ForgotPasswordModal isOpen={true} onClose={mockOnClose} />);
        fireEvent.click(screen.getByText('✕'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('validates invalid email', async () => {
        render(<ForgotPasswordModal isOpen={true} onClose={mockOnClose} />);

        const submitBtn = screen.getByText('Enviar Instrucciones');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Email inválido')).toBeDefined();
        });
    });

    it('submits valid email successfully', async () => {
        render(<ForgotPasswordModal isOpen={true} onClose={mockOnClose} />);

        
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: true })
        });

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByText('Enviar Instrucciones'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/forgot-password'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email: 'test@example.com' })
                })
            );
            expect(mockAddToast).toHaveBeenCalledWith('Correo enviado. Revisa tu bandeja de entrada.', 'success');
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('handles api error', async () => {
        render(<ForgotPasswordModal isOpen={true} onClose={mockOnClose} />);

        
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ success: false, error: 'Usuario no encontrado' })
        });

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByText('Enviar Instrucciones'));

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Usuario no encontrado', 'error');
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});
