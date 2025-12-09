import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateStockModal from '../UpdateStockModal';

describe('UpdateStockModal', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const defaultProps = {
        isOpen: true,
        productName: 'AMD Ryzen 5 5600X',
        currentStock: 10,
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<UpdateStockModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders modal with product name when open', () => {
        render(<UpdateStockModal {...defaultProps} />);
        expect(screen.getByText('Ajustar Stock')).toBeInTheDocument();
        expect(screen.getByText('AMD Ryzen 5 5600X')).toBeInTheDocument();
    });

    it('displays current stock value', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(10);
    });

    it('increments stock when + button clicked', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const plusBtn = screen.getByText('+');
        fireEvent.click(plusBtn);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(11);
    });

    it('decrements stock when - button clicked', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const minusBtn = screen.getByText('-');
        fireEvent.click(minusBtn);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(9);
    });

    it('does not go below 0 stock', () => {
        render(<UpdateStockModal {...defaultProps} currentStock={0} />);
        const minusBtn = screen.getByText('-');
        fireEvent.click(minusBtn);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(0);
    });

    it('calls onConfirm with new stock when Guardar clicked', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const plusBtn = screen.getByText('+');
        fireEvent.click(plusBtn);
        fireEvent.click(plusBtn);

        const saveBtn = screen.getByText('Guardar');
        fireEvent.click(saveBtn);

        expect(mockOnConfirm).toHaveBeenCalledWith(12);
    });

    it('calls onCancel when Cancelar clicked', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const cancelBtn = screen.getByText('Cancelar');
        fireEvent.click(cancelBtn);
        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('allows manual input of stock value', () => {
        render(<UpdateStockModal {...defaultProps} />);
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '50' } });
        expect(input).toHaveValue(50);
    });
});
