import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangePasswordModal from '../ChangePasswordModal';
import { useToastStore } from '../../../../stores/toastStore';
import * as apiUtils from '../../../../utils/api';

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(),
}));

vi.mock('../../../../utils/api', () => ({
    fetchApi: vi.fn(),
}));


vi.mock('../../../ui/feedback/PasswordStrengthMeter', () => ({
    default: () => <div data-testid="strength-meter">Strength Meter</div>
}));

vi.mock('../../auth/ForgotPasswordModal', () => ({
    default: ({ isOpen }: any) => isOpen ? <div data-testid="forgot-password-modal">Forgot Modal</div> : null
}));

describe('ChangePasswordModal', () => {
    const mockAddToast = vi.fn();
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useToastStore as any).mockReturnValue((s: any) => s.addToast || mockAddToast);
        
        (useToastStore as any).mockImplementation((selector: any) => {
            if (selector) return selector({ addToast: mockAddToast });
            return { addToast: mockAddToast };
        });
    });

    it('renders correctly when open', () => {
        render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);
        expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
        expect(screen.queryByTestId('strength-meter')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<ChangePasswordModal isOpen={false} onClose={mockOnClose} />);
        expect(screen.queryByText('Cambiar Contraseña')).not.toBeInTheDocument();
    });

    it('validates matching passwords', async () => {
        render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

        const currentPass = screen.getByPlaceholderText('********');
        const newPass = screen.getByPlaceholderText('Mínimo 6 caracteres');
        const confirmPass = screen.getByPlaceholderText('Repite la nueva contraseña');
        const submitBtn = screen.getByText('Actualizar');

        fireEvent.change(currentPass, { target: { value: 'old' } });
        fireEvent.change(newPass, { target: { value: 'new123' } });
        fireEvent.change(confirmPass, { target: { value: 'diff123' } });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
        });
        expect(apiUtils.fetchApi).not.toHaveBeenCalled();
    });

    it('submits correctly with valid data', async () => {
        render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

        const currentPass = screen.getByPlaceholderText('********');
        const newPass = screen.getByPlaceholderText('Mínimo 6 caracteres');
        const confirmPass = screen.getByPlaceholderText('Repite la nueva contraseña');
        const submitBtn = screen.getByText('Actualizar');

        fireEvent.change(currentPass, { target: { value: 'oldPassword' } });
        fireEvent.change(newPass, { target: { value: 'newPassword123' } });
        fireEvent.change(confirmPass, { target: { value: 'newPassword123' } });

        (apiUtils.fetchApi as any).mockResolvedValue({
            json: async () => ({ success: true })
        });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(apiUtils.fetchApi).toHaveBeenCalledWith('/auth/change-password', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ currentPassword: 'oldPassword', newPassword: 'newPassword123' })
            }));
        });

        expect(mockAddToast).toHaveBeenCalledWith('Contraseña actualizada con éxito', 'success');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('opens forgot password modal', () => {
        render(<ChangePasswordModal isOpen={true} onClose={mockOnClose} />);

        const forgotLink = screen.getByText('¿Olvidaste tu contraseña?');
        fireEvent.click(forgotLink);

        expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
    });
});
