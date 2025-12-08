import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    marca: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { BrandService } from './brands.service';

describe('BrandService', () => {
    let service: BrandService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BrandService();
    });

    describe('findAll', () => {
        it('should return all brands ordered by name', async () => {
            const mockBrands = [
                { id: 1, nombre: 'AMD', logo: 'amd.png' },
                { id: 2, nombre: 'Intel', logo: 'intel.png' }
            ];
            mockPrisma.marca.findMany.mockResolvedValue(mockBrands);

            const result = await service.findAll();

            expect(mockPrisma.marca.findMany).toHaveBeenCalledWith({
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockBrands);
        });

        it('should return empty array when no brands exist', async () => {
            mockPrisma.marca.findMany.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('should return brand by id', async () => {
            const mockBrand = { id: 1, nombre: 'NVIDIA', logo: 'nvidia.png' };
            mockPrisma.marca.findUnique.mockResolvedValue(mockBrand);

            const result = await service.findById(1);

            expect(mockPrisma.marca.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(mockBrand);
        });

        it('should return null for non-existent brand', async () => {
            mockPrisma.marca.findUnique.mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new brand', async () => {
            const newBrand = { id: 1, nombre: 'Corsair', logo: 'corsair.png' };
            mockPrisma.marca.findUnique.mockResolvedValue(null);
            mockPrisma.marca.create.mockResolvedValue(newBrand);

            const result = await service.create('Corsair', 'corsair.png');

            expect(mockPrisma.marca.create).toHaveBeenCalledWith({
                data: { nombre: 'Corsair', logo: 'corsair.png' }
            });
            expect(result).toEqual(newBrand);
        });

        it('should create brand without logo', async () => {
            const newBrand = { id: 1, nombre: 'Generic', logo: undefined };
            mockPrisma.marca.findUnique.mockResolvedValue(null);
            mockPrisma.marca.create.mockResolvedValue(newBrand);

            const result = await service.create('Generic');

            expect(mockPrisma.marca.create).toHaveBeenCalledWith({
                data: { nombre: 'Generic', logo: undefined }
            });
        });

        it('should throw error if brand already exists', async () => {
            mockPrisma.marca.findUnique.mockResolvedValue({ id: 1, nombre: 'AMD' });

            await expect(service.create('AMD')).rejects.toThrow('La marca ya existe');
            expect(mockPrisma.marca.create).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete brand by id', async () => {
            mockPrisma.marca.delete.mockResolvedValue({ id: 1 });

            await service.delete(1);

            expect(mockPrisma.marca.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });
});
