import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderTimeline from '../OrderTimeline';

describe('OrderTimeline', () => {
    it('renders standard shipping steps correctly', () => {
        render(<OrderTimeline status="PENDIENTE_PAGO" shippingMethod="ENVIO" />);

        expect(screen.getByText('Esperando Pago')).toBeInTheDocument();
        expect(screen.getByText('Preparación')).toBeInTheDocument();
        expect(screen.getByText('En Camino')).toBeInTheDocument();
        expect(screen.getByText('Entregado')).toBeInTheDocument();
    });

    it('renders pickup steps correctly (3 steps)', () => {
        render(<OrderTimeline status="PENDIENTE_PAGO" shippingMethod="RETIRO" />);

        expect(screen.getByText('Esperando Pago')).toBeInTheDocument();
        expect(screen.getByText('Listo para retirar')).toBeInTheDocument();
        expect(screen.getByText('Retirado')).toBeInTheDocument();
        expect(screen.queryByText('Preparación')).not.toBeInTheDocument();
    });

    it('marks active step correctly', () => {
        const {} = render(<OrderTimeline status="ENVIADO" shippingMethod="ENVIO" />);
        
        
    });
});
