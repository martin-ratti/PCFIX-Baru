import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
    const defaultProps = {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message content',
        onConfirm: vi.fn(),
        onCancel: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders title and message when open', () => {
        render(<ConfirmModal {...defaultProps} />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test message content')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', () => {
        render(<ConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Confirmar'));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', () => {
        render(<ConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Cancelar'));
        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('uses custom button texts', () => {
        render(<ConfirmModal {...defaultProps} confirmText="Sí, eliminar" cancelText="No, volver" />);
        expect(screen.getByText('Sí, eliminar')).toBeInTheDocument();
        expect(screen.getByText('No, volver')).toBeInTheDocument();
    });

    it('applies danger styling when isDanger is true', () => {
        render(<ConfirmModal {...defaultProps} isDanger />);
        const title = screen.getByText('Test Title');
        expect(title).toHaveClass('text-red-600');
    });
});
