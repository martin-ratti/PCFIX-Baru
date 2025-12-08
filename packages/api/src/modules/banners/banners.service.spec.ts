import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    banner: {
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    },
    marca: {
        findUnique: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { BannerService } from './banners.service';

describe('BannerService', () => {
    let service: BannerService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BannerService();
    });

    describe('findAll', () => {
        it('should return all banners with marca info', async () => {
            const mockBanners = [
                { id: 1, marcaId: 1, imagen: 'banner1.jpg', marca: { id: 1, nombre: 'AMD' } },
                { id: 2, marcaId: 2, imagen: 'banner2.jpg', marca: { id: 2, nombre: 'Intel' } }
            ];
            mockPrisma.banner.findMany.mockResolvedValue(mockBanners);

            const result = await service.findAll();

            expect(mockPrisma.banner.findMany).toHaveBeenCalledWith({
                include: { marca: true },
                orderBy: { createdAt: 'desc' }
            });
            expect(result).toEqual(mockBanners);
        });

        it('should return empty array when no banners', async () => {
            mockPrisma.banner.findMany.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should create a banner for existing brand', async () => {
            mockPrisma.marca.findUnique.mockResolvedValue({ id: 1, nombre: 'AMD' });
            mockPrisma.banner.create.mockResolvedValue({
                id: 1,
                marcaId: 1,
                imagen: 'new-banner.jpg'
            });

            const result = await service.create(1, 'new-banner.jpg');

            expect(mockPrisma.marca.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(mockPrisma.banner.create).toHaveBeenCalledWith({
                data: { marcaId: 1, imagen: 'new-banner.jpg' }
            });
        });

        it('should throw error if brand does not exist', async () => {
            mockPrisma.marca.findUnique.mockResolvedValue(null);

            await expect(service.create(999, 'banner.jpg')).rejects.toThrow('La marca especificada no existe');
            expect(mockPrisma.banner.create).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete banner by id', async () => {
            mockPrisma.banner.delete.mockResolvedValue({ id: 1 });

            await service.delete(1);

            expect(mockPrisma.banner.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });
});
