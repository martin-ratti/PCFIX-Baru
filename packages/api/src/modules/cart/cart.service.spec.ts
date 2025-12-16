import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService } from './cart.service';
import { prisma } from '../../shared/database/prismaClient';

vi.mock('../../shared/database/prismaClient', () => ({
    prisma: {
        cart: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
        },
        $transaction: vi.fn(),
        producto: {
            findMany: vi.fn(),
        }
    },
}));

describe('CartService', () => {
    let service: CartService;

    beforeEach(() => {
        service = new CartService();
        vi.clearAllMocks();
    });

    describe('syncCart', () => {
        it('should sync cart successfully', async () => {
            const userId = 1;
            const items = [{ id: '1', quantity: 2 }];
            const cart = { id: 1, userId };

            vi.mocked(prisma.cart.upsert).mockResolvedValue(cart as any);

            // Mock Transaction
            vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
                const tx = {
                    cartItem: {
                        deleteMany: vi.fn(),
                        createMany: vi.fn(),
                    },
                    cart: {
                        findUnique: vi.fn().mockResolvedValue(cart),
                    }
                };
                return await callback(tx as any);
            });

            // Mock Product Validation
            vi.mocked(prisma.producto.findMany).mockResolvedValue([{ id: 1 }] as any);

            const result = await service.syncCart(userId, items);

            expect(prisma.cart.upsert).toHaveBeenCalled();
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(result).toEqual(cart);
        });
    });

    describe('getCart', () => {
        it('should return cart', async () => {
            const cart = { id: 1, userId: 1, items: [] };
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(cart as any);

            const result = await service.getCart(1);

            expect(result).toEqual(cart);
        });
    });
});
