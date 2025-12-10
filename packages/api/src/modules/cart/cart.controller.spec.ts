import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as CartController from './cart.controller';
import { CartService } from './cart.service';

vi.mock('./cart.service');

describe('CartController', () => {
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

    describe('syncCart', () => {
        it('should sync cart successfully', async () => {
            req.body = { userId: '1', items: [] };
            const cart = { id: 1, userId: 1, items: [] };
            vi.spyOn(CartService.prototype, 'syncCart').mockResolvedValue(cart as any);

            await CartController.syncCart(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: cart });
        });

        it('should return 400 if userId is missing', async () => {
            req.body = { items: [] };

            await CartController.syncCart(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'User ID required' });
        });

        it('should handle sync error', async () => {
            req.body = { userId: '1' };
            vi.spyOn(CartService.prototype, 'syncCart').mockRejectedValue(new Error('Sync Error'));

            await CartController.syncCart(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Failed to sync cart' });
        });
    });

    describe('getCart', () => {
        it('should get cart successfully', async () => {
            req.params = { userId: '1' };
            const cart = { id: 1, userId: 1, items: [] };
            vi.spyOn(CartService.prototype, 'getCart').mockResolvedValue(cart as any);

            await CartController.getCart(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: cart });
        });

        it('should return 400 if userId missing', async () => {
            req.params = {};

            await CartController.getCart(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'User ID required' });
        });
    });
});
