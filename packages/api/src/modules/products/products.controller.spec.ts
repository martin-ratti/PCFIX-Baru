import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const { mockProductService } = vi.hoisted(() => ({
    mockProductService: {
        findAll: vi.fn(),
        findAllPOS: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findBestSellers: vi.fn(),
    }
}));

vi.mock('./products.service', () => ({
    ProductService: class {
        findAll = mockProductService.findAll;
        findAllPOS = mockProductService.findAllPOS;
        findById = mockProductService.findById;
        create = mockProductService.create;
        update = mockProductService.update;
        delete = mockProductService.delete;
        findBestSellers = mockProductService.findBestSellers;
    }
}));

vi.mock('./products.schema', () => ({
    createProductSchema: {
        parse: vi.fn((data: any) => data),
        partial: vi.fn().mockReturnValue({ parse: vi.fn((data: any) => data) })
    }
}));

import { getAll, getForPOS, getById, create, update, remove, getBestSellers } from './products.controller';

function mockReqRes(overrides: any = {}) {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status, json } as any;
    const req = { body: {}, params: {}, query: {}, ...overrides } as any;
    return { req, res, json, status };
}

describe('Products Controller - Full Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('should return products with default pagination', async () => {
            mockProductService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            const { req, res, json } = mockReqRes({ query: {} });
            await getAll(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should pass all query params', async () => {
            mockProductService.findAll.mockResolvedValue({ data: [], meta: {} });
            const { req, res } = mockReqRes({
                query: { categoryId: '1', marcaId: '2', search: 'gpu', limit: '5', page: '2', filter: 'ofertas', order: 'price_asc', minimal: 'true' }
            });
            await getAll(req, res);
            expect(mockProductService.findAll).toHaveBeenCalledWith(2, 5, 1, 2, 'gpu', 'ofertas', 'price_asc', true);
        });

        it('should use brandId when provided', async () => {
            mockProductService.findAll.mockResolvedValue({ data: [], meta: {} });
            const { req, res } = mockReqRes({ query: { brandId: '3' } });
            await getAll(req, res);
            expect(mockProductService.findAll).toHaveBeenCalledWith(1, 10, undefined, 3, undefined, undefined, 'newest', false);
        });

        it('should return 500 on error', async () => {
            mockProductService.findAll.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ query: {} });
            await getAll(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getForPOS', () => {
        it('should return POS products', async () => {
            mockProductService.findAllPOS.mockResolvedValue([{ id: 1 }]);
            const { req, res, json } = mockReqRes({ query: { search: 'ram', limit: '5' } });
            await getForPOS(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockProductService.findAllPOS.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ query: {} });
            await getForPOS(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getById', () => {
        it('should return 400 on invalid id', async () => {
            const { req, res, status } = mockReqRes({ params: { id: 'abc' } });
            await getById(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 404 when not found', async () => {
            mockProductService.findById.mockResolvedValue(null);
            const { req, res, status } = mockReqRes({ params: { id: '999' } });
            await getById(req, res);
            expect(status).toHaveBeenCalledWith(404);
        });

        it('should return product', async () => {
            mockProductService.findById.mockResolvedValue({ id: 1, nombre: 'GPU' });
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await getById(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockProductService.findById.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await getById(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('create', () => {
        it('should create product successfully', async () => {
            mockProductService.create.mockResolvedValue({ id: 1 });
            const { req, res, status } = mockReqRes({
                body: { nombre: 'GPU', descripcion: 'Desc', precio: '1000', stock: '10' },
                file: { path: '/uploads/img.jpg' }
            });
            await create(req, res);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should create product without file', async () => {
            mockProductService.create.mockResolvedValue({ id: 1 });
            const { req, res, status } = mockReqRes({
                body: { nombre: 'GPU', descripcion: 'Desc', precio: '1000', stock: '10' }
            });
            await create(req, res);
            expect(status).toHaveBeenCalledWith(201);
        });

        it('should return 400 on Zod error', async () => {
            const { z } = await import('zod');
            const { createProductSchema } = await import('./products.schema');
            (createProductSchema.parse as any).mockImplementation(() => { throw new z.ZodError([]); });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const { req, res, status } = mockReqRes({ body: {} });
            await create(req, res);
            expect(status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on unknown error', async () => {
            const { createProductSchema } = await import('./products.schema');
            (createProductSchema.parse as any).mockImplementation(() => { throw new Error('DB error'); });
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const { req, res, status } = mockReqRes({ body: {} });
            await create(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('update', () => {
        it('should update product', async () => {
            mockProductService.update.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({
                params: { id: '1' },
                body: { nombre: 'GPU Updated', precio: '2000' },
                file: { path: '/uploads/new.jpg' }
            });
            await update(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should update without file', async () => {
            mockProductService.update.mockResolvedValue({ id: 1 });
            const { req, res, json } = mockReqRes({
                params: { id: '1' },
                body: { nombre: 'GPU Updated' }
            });
            await update(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockProductService.update.mockRejectedValue(new Error('Fail'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const { req, res, status } = mockReqRes({ params: { id: '1' }, body: {} });
            await update(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('remove', () => {
        it('should delete product', async () => {
            mockProductService.delete.mockResolvedValue({});
            const { req, res, json } = mockReqRes({ params: { id: '1' } });
            await remove(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockProductService.delete.mockRejectedValue(new Error('Fail'));
            const { req, res, status } = mockReqRes({ params: { id: '1' } });
            await remove(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });

    describe('getBestSellers', () => {
        it('should return best sellers', async () => {
            mockProductService.findBestSellers.mockResolvedValue([{ id: 1 }]);
            const { req, res, json } = mockReqRes({ query: { limit: '5' } });
            await getBestSellers(req, res);
            expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should use default limit', async () => {
            mockProductService.findBestSellers.mockResolvedValue([]);
            const { req, res } = mockReqRes({ query: {} });
            await getBestSellers(req, res);
            expect(mockProductService.findBestSellers).toHaveBeenCalledWith(10);
        });

        it('should return 500 on error', async () => {
            mockProductService.findBestSellers.mockRejectedValue(new Error('Fail'));
            vi.spyOn(console, 'error').mockImplementation(() => { });
            const { req, res, status } = mockReqRes({ query: {} });
            await getBestSellers(req, res);
            expect(status).toHaveBeenCalledWith(500);
        });
    });
});
