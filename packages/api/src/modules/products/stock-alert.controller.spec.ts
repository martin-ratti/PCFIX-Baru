import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as StockAlertController from './stock-alert.controller';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        stockAlert: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

describe('StockAlertController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        req = {};
        res = {
            json,
            status,
        };
        vi.clearAllMocks();
    });

    describe('subscribeToStockAlert', () => {
        it('should subscribe successfully', async () => {
            req.body = { email: 'test@test.com', productId: 1 };

            const stockAlert = (prisma as any).stockAlert;
            stockAlert.findUnique.mockResolvedValue(null);
            stockAlert.create.mockResolvedValue({ id: 1 });

            await StockAlertController.subscribeToStockAlert(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: '¡Te avisaremos cuando haya stock!' });
        });

        it('should handle already subscribed', async () => {
            req.body = { email: 'test@test.com', productId: 1 };

            const stockAlert = (prisma as any).stockAlert;
            stockAlert.findUnique.mockResolvedValue({ id: 1 });

            await StockAlertController.subscribeToStockAlert(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Ya estás suscrito a esta alerta' });
        });

        it('should return 400 if missing fields', async () => {
            req.body = { email: 'test@test.com' };

            await StockAlertController.subscribeToStockAlert(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, message: 'Email y producto son requeridos' });
        });

        it('should handle errors', async () => {
            req.body = { email: 'test@test.com', productId: 1 };
            const stockAlert = (prisma as any).stockAlert;
            stockAlert.findUnique.mockRejectedValue(new Error('DB Error'));

            await StockAlertController.subscribeToStockAlert(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, message: 'Error interno del servidor' });
        });
    });
});
