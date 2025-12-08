import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    favorite: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: mockPrisma
}));

import { FavoriteService } from './favorites.service';

describe('FavoriteService', () => {
    let service: FavoriteService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new FavoriteService();
    });

    describe('getFavoritesByUserId', () => {
        it('should return all favorites for a user', async () => {
            const mockFavorites = [
                { userId: 1, productoId: 10, producto: { id: 10, nombre: 'GPU' } },
                { userId: 1, productoId: 20, producto: { id: 20, nombre: 'CPU' } }
            ];
            mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

            const result = await service.getFavoritesByUserId(1);

            expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: {
                    producto: {
                        include: { categoria: true, marca: true }
                    }
                }
            });
            expect(result).toEqual(mockFavorites);
        });

        it('should return empty array for user with no favorites', async () => {
            mockPrisma.favorite.findMany.mockResolvedValue([]);

            const result = await service.getFavoritesByUserId(999);

            expect(result).toEqual([]);
        });
    });

    describe('toggleFavorite', () => {
        it('should add favorite if not exists', async () => {
            mockPrisma.favorite.findUnique.mockResolvedValue(null);
            mockPrisma.favorite.create.mockResolvedValue({ userId: 1, productoId: 10 });

            const result = await service.toggleFavorite(1, 10);

            expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
                data: { userId: 1, productoId: 10 }
            });
            expect(result.added).toBe(true);
            expect(result.message).toBe('Producto agregado a favoritos');
        });

        it('should remove favorite if already exists', async () => {
            mockPrisma.favorite.findUnique.mockResolvedValue({ userId: 1, productoId: 10 });
            mockPrisma.favorite.delete.mockResolvedValue({ userId: 1, productoId: 10 });

            const result = await service.toggleFavorite(1, 10);

            expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
                where: { userId_productoId: { userId: 1, productoId: 10 } }
            });
            expect(result.added).toBe(false);
            expect(result.message).toBe('Producto eliminado de favoritos');
        });
    });
});
