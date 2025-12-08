import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to properly hoist mock object
const mockPrisma = vi.hoisted(() => ({
    categoria: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    },
    producto: {
        count: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { CategoryService } from './categories.service';

describe('CategoryService', () => {
    let service: CategoryService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CategoryService();
    });

    describe('findAll', () => {
        it('should return categories when flat=true', async () => {
            const mockCategories = [
                { id: 1, nombre: 'Hardware', padreId: null },
                { id: 2, nombre: 'Software', padreId: null }
            ];
            mockPrisma.categoria.findMany.mockResolvedValue(mockCategories);

            const result = await service.findAll(true);

            expect(mockPrisma.categoria.findMany).toHaveBeenCalled();
            expect(result).toEqual(mockCategories);
        });

        it('should return hierarchical structure when flat=false', async () => {
            const mockCategories = [
                { id: 1, nombre: 'Hardware', padreId: null, subcategorias: [] }
            ];
            mockPrisma.categoria.findMany.mockResolvedValue(mockCategories);

            const result = await service.findAll(false);

            expect(result).toEqual(mockCategories);
        });
    });

    describe('findById', () => {
        it('should return category with subcategories', async () => {
            const mockCategory = { id: 1, nombre: 'Hardware', subcategorias: [] };
            mockPrisma.categoria.findUnique.mockResolvedValue(mockCategory);

            const result = await service.findById(1);

            expect(mockPrisma.categoria.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: { subcategorias: true }
            });
            expect(result).toEqual(mockCategory);
        });

        it('should return null for non-existent category', async () => {
            mockPrisma.categoria.findUnique.mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new root category', async () => {
            const newCategory = { id: 1, nombre: 'Periféricos', padreId: null };
            mockPrisma.categoria.create.mockResolvedValue(newCategory);

            const result = await service.create({ nombre: 'Periféricos' });

            expect(mockPrisma.categoria.create).toHaveBeenCalledWith({
                data: { nombre: 'Periféricos', padreId: null }
            });
            expect(result).toEqual(newCategory);
        });

        it('should create a subcategory with padreId', async () => {
            const subCategory = { id: 2, nombre: 'Teclados', padreId: 1 };
            mockPrisma.categoria.create.mockResolvedValue(subCategory);

            const result = await service.create({ nombre: 'Teclados', padreId: 1 });

            expect(mockPrisma.categoria.create).toHaveBeenCalledWith({
                data: { nombre: 'Teclados', padreId: 1 }
            });
            expect(result).toEqual(subCategory);
        });
    });

    describe('delete', () => {
        it('should delete category if no products exist', async () => {
            mockPrisma.producto.count.mockResolvedValue(0);
            mockPrisma.categoria.delete.mockResolvedValue({ id: 1 });

            await service.delete(1);

            expect(mockPrisma.producto.count).toHaveBeenCalledWith({ where: { categoriaId: 1 } });
            expect(mockPrisma.categoria.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should throw error if category has products', async () => {
            mockPrisma.producto.count.mockResolvedValue(5);

            await expect(service.delete(1)).rejects.toThrow('No se puede eliminar: Tiene 5 productos.');
            expect(mockPrisma.categoria.delete).not.toHaveBeenCalled();
        });
    });
});
