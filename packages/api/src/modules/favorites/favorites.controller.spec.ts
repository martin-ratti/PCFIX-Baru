import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as FavoritesController from './favorites.controller';
import { FavoriteService } from './favorites.service';

vi.mock('./favorites.service');

describe('FavoritesController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: any;
    let status: any;

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

    describe('getByUserId', () => {
        it('should return favorites', async () => {
            req.params = { userId: '1' };
            const favorites = [{ producto: { id: 1, nombre: 'Prod 1' } }];
            vi.spyOn(FavoriteService.prototype, 'getFavoritesByUserId').mockResolvedValue(favorites as any);

            await FavoritesController.getByUserId(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: favorites.map(f => f.producto) });
        });

        it('should handle errors', async () => {
            req.params = { userId: '1' };
            vi.spyOn(FavoriteService.prototype, 'getFavoritesByUserId').mockRejectedValue(new Error('Error'));

            await FavoritesController.getByUserId(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error al obtener favoritos' });
        });
    });

    describe('toggleFavorite', () => {
        it('should toggle favorite successfully', async () => {
            req.body = { userId: 1, productId: 1, state: true };
            const result = { success: true };
            vi.spyOn(FavoriteService.prototype, 'toggleFavorite').mockResolvedValue(result as any);

            await FavoritesController.toggleFavorite(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
        });

        it('should return 400 if fields missing', async () => {
            req.body = { userId: 1 };

            await FavoritesController.toggleFavorite(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Faltan IDs de usuario/producto' });
        });
    });
});
