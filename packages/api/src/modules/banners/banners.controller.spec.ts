import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as BannersController from './banners.controller';
import { BannerService } from './banners.service';

// Mock dependencies
vi.mock('./banners.service');

describe('BannersController', () => {
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

    describe('getAll', () => {
        it('should return all banners', async () => {
            const banners = [{ id: 1, imagenUrl: 'http://test.com/img.jpg' }];
            vi.spyOn(BannerService.prototype, 'findAll').mockResolvedValue(banners as any);

            await BannersController.getAll(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: banners });
        });

        it('should handle errors', async () => {
            vi.spyOn(BannerService.prototype, 'findAll').mockRejectedValue(new Error('Error'));

            await BannersController.getAll(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error al obtener banners' });
        });
    });

    describe('create', () => {
        it('should create a banner successfully', async () => {
            req.body = { marcaId: '1' };
            req.file = { filename: 'test.jpg' } as any;
            req.protocol = 'http';
            req.get = vi.fn().mockReturnValue('localhost');

            const newBanner = { id: 1, marcaId: 1, imagenUrl: 'http://localhost/uploads/test.jpg' };
            vi.spyOn(BannerService.prototype, 'create').mockResolvedValue(newBanner as any);

            await BannersController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(json).toHaveBeenCalledWith({ success: true, data: newBanner });
        });

        it('should return 400 if no image provided', async () => {
            req.body = { marcaId: '1' };

            await BannersController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Imagen requerida' });
        });

        it('should return 400 if invalid marcaId', async () => {
            req.body = { marcaId: '0' };
            req.file = { filename: 'test.jpg' } as any;

            await BannersController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Selecciona una marca válida' });
        });
    });

    describe('remove', () => {
        it('should remove a banner', async () => {
            req.params = { id: '1' };
            vi.spyOn(BannerService.prototype, 'delete').mockResolvedValue({} as any);

            await BannersController.remove(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Banner eliminado' });
        });

        it('should handle errors during removal', async () => {
            req.params = { id: '1' };
            vi.spyOn(BannerService.prototype, 'delete').mockRejectedValue(new Error('Error'));

            await BannersController.remove(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error al eliminar banner' });
        });
    });
});
