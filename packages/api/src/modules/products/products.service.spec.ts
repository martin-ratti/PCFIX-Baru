import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from './products.service';
import { prisma } from '../../shared/database/prismaClient';

// Mock EmailService
const mockSendPriceDropNotification = vi.fn();
const mockSendStockAlertEmail = vi.fn();

vi.mock('../../shared/services/EmailService', () => {
    return {
        EmailService: class {
            sendPriceDropNotification = mockSendPriceDropNotification;
            sendStockAlertEmail = mockSendStockAlertEmail;
        }
    };
});

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        producto: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        favorite: {
            findMany: vi.fn()
        },
        stockAlert: {
            findMany: vi.fn(),
            deleteMany: vi.fn()
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

    it('should send price drop email when price decreases', async () => {
        const productId = 1;
        const oldPrice = 1000;
        const newPrice = 800;
        const userEmail = 'user@example.com';

        // 1. Mock FindUnique (Current Product)
        (prisma.producto.findUnique as any).mockResolvedValue({
            id: productId,
            nombre: 'GPU Test',
            stock: 10,
            precio: oldPrice,
            foto: 'img.jpg'
        });

        // 2. Mock Update (Updated Product)
        (prisma.producto.update as any).mockResolvedValue({
            id: productId,
            nombre: 'GPU Test',
            stock: 10,
            precio: newPrice,
            foto: 'img.jpg'
        });

        // 3. Mock Favorites (Users watching this product)
        (prisma.favorite.findMany as any).mockResolvedValue([
            { user: { email: userEmail } }
        ]);

        // Act
        await service.update(productId, { precio: newPrice });

        // Assert
        expect(prisma.favorite.findMany).toHaveBeenCalledWith({
            where: { productoId: productId },
            include: { user: true }
        });

        // Wait for async email sending (since it might not be awaited properly in service or mocked)
        // In our implementation we do `await Promise.all(...)` so it should be called immediately.
        expect(mockSendPriceDropNotification).toHaveBeenCalledWith(
            userEmail,
            'GPU Test',
            expect.stringContaining(`/tienda/producto/${productId}`),
            'img.jpg',
            oldPrice,
            newPrice
        );
    });

    it('should NOT send email if price increases', async () => {
        const productId = 1;
        const oldPrice = 1000;
        const newPrice = 1200;

        (prisma.producto.findUnique as any).mockResolvedValue({
            id: productId,
            precio: oldPrice
        });

        (prisma.producto.update as any).mockResolvedValue({
            id: productId,
            precio: newPrice
        });

        await service.update(productId, { precio: newPrice });

        expect(prisma.favorite.findMany).not.toHaveBeenCalled();
        expect(mockSendPriceDropNotification).not.toHaveBeenCalled();
    });
});
