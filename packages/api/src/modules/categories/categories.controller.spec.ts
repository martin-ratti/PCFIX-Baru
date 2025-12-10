import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as CategoriesController from './categories.controller';
import { CategoryService } from './categories.service';

vi.mock('./categories.service');

describe('CategoriesController', () => {
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

    describe('getAll', () => {
        it('should return all categories', async () => {
            req.query = { flat: 'false' };
            const categories = [{ id: 1, nombre: 'Cat A' }];
            vi.spyOn(CategoryService.prototype, 'findAll').mockResolvedValue(categories as any);

            await CategoriesController.getAll(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: categories });
        });
    });

    describe('getById', () => {
        it('should return category by id', async () => {
            req.params = { id: '1' };
            const category = { id: 1, nombre: 'Cat A' };
            vi.spyOn(CategoryService.prototype, 'findById').mockResolvedValue(category as any);

            await CategoriesController.getById(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, data: category });
        });

        it('should return 404 if not found', async () => {
            req.params = { id: '1' };
            vi.spyOn(CategoryService.prototype, 'findById').mockResolvedValue(null);

            await CategoriesController.getById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Categoría no encontrada' });
        });
    });

    describe('create', () => {
        it('should create category', async () => {
            req.body = { nombre: 'New Cat' };
            const newCat = { id: 1, nombre: 'New Cat' };
            vi.spyOn(CategoryService.prototype, 'create').mockResolvedValue(newCat as any);

            await CategoriesController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(json).toHaveBeenCalledWith({ success: true, data: newCat });
        });

        it('should return 400 if name missing', async () => {
            req.body = {};

            await CategoriesController.create(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(json).toHaveBeenCalledWith({ success: false, error: 'Nombre requerido' });
        });
    });

    describe('remove', () => {
        it('should remove category', async () => {
            req.params = { id: '1' };
            vi.spyOn(CategoryService.prototype, 'delete').mockResolvedValue({} as any);

            await CategoriesController.remove(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Categoría eliminada' });
        });
    });
});
