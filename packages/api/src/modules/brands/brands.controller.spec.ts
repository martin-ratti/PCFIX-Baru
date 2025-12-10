import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as BrandsController from './brands.controller';
import { BrandService } from './brands.service';

vi.mock('./brands.service');

describe('BrandsController', () => {
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
        it('should return all brands', async () => {
            const brands = [{ id: 1, nombre: 'Brand A' }];
            vi.spyOn(BrandService.prototype, 'findAll').mockResolvedValue(brands as any);

            await BrandsController.getAll(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: brands });
        });

        it('should handle errors', async () => {
            vi.spyOn(BrandService.prototype, 'findAll').mockRejectedValue(new Error('Error'));

            await BrandsController.getAll(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error obteniendo marcas' });
        });
    });

    describe('getById', () => {
        it('should return a brand by id', async () => {
            req.params = { id: '1' };
            const brand = { id: 1, nombre: 'Brand A' };
            vi.spyOn(BrandService.prototype, 'findById').mockResolvedValue(brand as any);

            await BrandsController.getById(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: brand });
        });

        it('should return 404 if brand not found', async () => {
            req.params = { id: '1' };
            vi.spyOn(BrandService.prototype, 'findById').mockResolvedValue(null);

            await BrandsController.getById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Marca no encontrada' });
        });

        it('should handle errors', async () => {
            req.params = { id: '1' };
            vi.spyOn(BrandService.prototype, 'findById').mockRejectedValue(new Error('Error'));

            await BrandsController.getById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Error obteniendo marca' });
        });
    });

    describe('create', () => {
        it('should create a brand successfully', async () => {
            req.body = { nombre: 'New Brand' };
            req.file = { filename: 'logo.jpg' } as any;
            req.protocol = 'http';
            req.get = vi.fn().mockReturnValue('localhost');

            const newBrand = { id: 1, nombre: 'New Brand', logoUrl: 'http://localhost/uploads/logo.jpg' };
            vi.spyOn(BrandService.prototype, 'create').mockResolvedValue(newBrand as any);

            await BrandsController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(json).toHaveBeenCalledWith({ success: true, data: newBrand });
        });

        it('should return 400 if name is missing', async () => {
            req.body = {};

            await BrandsController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Nombre requerido' });
        });
    });

    describe('remove', () => {
        it('should remove a brand', async () => {
            req.params = { id: '1' };
            vi.spyOn(BrandService.prototype, 'delete').mockResolvedValue({} as any);

            await BrandsController.remove(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Marca eliminada' });
        });

        it('should handle deletion errors', async () => {
            req.params = { id: '1' };
            vi.spyOn(BrandService.prototype, 'delete').mockRejectedValue(new Error('Dependency Error'));

            await BrandsController.remove(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'No se pudo eliminar (¿Tiene productos?)' });
        });
    });
});
