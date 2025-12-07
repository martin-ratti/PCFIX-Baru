import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from './products.service';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        producto: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
        $transaction: vi.fn((args) => args),
    }
}));

describe('Products Service', () => {
    let service: ProductService;

    beforeEach(() => {
        service = new ProductService();
        vi.clearAllMocks();
    });

    it('should use minimal select when selectMinimal is true', async () => {
        (prisma.$transaction as any).mockResolvedValue([1, []]); // count, products

        await service.findAll(1, 10, undefined, undefined, 'test', undefined, undefined, true);

        expect(prisma.producto.findMany).toHaveBeenCalledWith(expect.objectContaining({
            select: {
                id: true,
                nombre: true,
                precio: true,
                foto: true,
                categoria: { select: { nombre: true } }
            }
        }));
    });

    it('should include full relations when selectMinimal is false', async () => {
        (prisma.$transaction as any).mockResolvedValue([1, []]);

        await service.findAll(1, 10, undefined, undefined, 'test', undefined, undefined, false);

        expect(prisma.producto.findMany).toHaveBeenCalledWith(expect.objectContaining({
            include: { categoria: true, marca: true }
        }));
    });
});
