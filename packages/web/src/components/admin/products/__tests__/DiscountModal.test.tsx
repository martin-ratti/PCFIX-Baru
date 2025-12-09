import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiscountModal from '../DiscountModal';

describe('DiscountModal', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    const mockProduct = {
        id: 1,
        nombre: 'Intel Core i7-12700K',
        precio: '200000',
        precioOriginal: null,
    };

    const defaultProps = {
        isOpen: true,
        product: mockProduct,
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<DiscountModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when product is null', () => {
        const { container } = render(<DiscountModal {...defaultProps} product={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders modal with product name when open', () => {
        render(<DiscountModal {...defaultProps} />);
        expect(screen.getByText('Aplicar Descuento')).toBeInTheDocument();
        expect(screen.getByText('Intel Core i7-12700K')).toBeInTheDocument();
    });

    it('shows percentage mode by default', () => {
        render(<DiscountModal {...defaultProps} />);
        const percentBtn = screen.getByText('Porcentaje (%)');
        expect(percentBtn).toHaveClass('bg-white');
    });

    it('switches to fixed price mode', () => {
        render(<DiscountModal {...defaultProps} />);
        const fixedBtn = screen.getByText('Precio Fijo ($)');
        fireEvent.click(fixedBtn);
        expect(fixedBtn).toHaveClass('bg-white');
    });

    it('calculates discount price from percentage', () => {
        render(<DiscountModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: 20');
        fireEvent.change(input, { target: { value: '20' } });

        // 20% off of 200000 = 160000
        expect(screen.getByText('$160.000')).toBeInTheDocument();
    });

    it('shows regular price with strikethrough', () => {
        render(<DiscountModal {...defaultProps} />);
        const prices = screen.getAllByText('$200.000');
        const regularPrice = prices.find(p => p.classList.contains('line-through'));
        expect(regularPrice).toBeInTheDocument();
    });

    it('calls onConfirm with new price when Aplicar clicked', () => {
        render(<DiscountModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: 20');
        fireEvent.change(input, { target: { value: '10' } });

        const applyBtn = screen.getByText('Aplicar');
        fireEvent.click(applyBtn);

        // 10% off of 200000 = 180000, original is 200000
        expect(mockOnConfirm).toHaveBeenCalledWith(180000, 200000);
    });

    it('calls onCancel when Cancelar clicked', () => {
        render(<DiscountModal {...defaultProps} />);
        const cancelBtn = screen.getByText('Cancelar');
        fireEvent.click(cancelBtn);
        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('removes offer when new price equals or exceeds base price', () => {
        render(<DiscountModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: 20');
        fireEvent.change(input, { target: { value: '0' } });

        const applyBtn = screen.getByText('Aplicar');
        fireEvent.click(applyBtn);

        expect(mockOnConfirm).toHaveBeenCalledWith(200000, null);
    });
});
