import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSale } from './sales.controller';
import { Request, Response } from 'express';
import { SalesService } from './sales.service';

vi.mock('./sales.service');

describe('Sales Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { status, json };
        req = { body: {}, user: { id: 1 } } as any;
        vi.clearAllMocks();
    });

    it('should reject invalid payment method', async () => {
        req.body = {
            items: [{ id: 1, quantity: 1 }],
            subtotal: 100,
            tipoEntrega: 'RETIRO',
            medioPago: 'INVALIDO' 
        };

        await createSale(req as Request, res as Response);

        expect(status).toHaveBeenCalledWith(400); 
        expect(json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Datos de venta inválidos'
        }));
    });

    it('should accept valid TRANSFERENCIA payment', async () => {
        req.body = {
            items: [{ id: 1, quantity: 1 }],
            subtotal: 100,
            tipoEntrega: 'RETIRO',
            medioPago: 'TRANSFERENCIA'
        };

        (SalesService.prototype.createSale as any).mockResolvedValue({ id: 100 });

        await createSale(req as Request, res as Response);

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({ success: true, data: { id: 100 } });
    });

    it('should reject missing quantity', async () => {
        req.body = {
            items: [{ id: 1 }], 
            subtotal: 100,
            tipoEntrega: 'RETIRO',
            medioPago: 'EFECTIVO'
        };

        await createSale(req as Request, res as Response);

        expect(status).toHaveBeenCalledWith(400);
    });
});
