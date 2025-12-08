import { prisma } from '../../shared/database/prismaClient';

export interface SyncCartItemDto {
    id: string; // Product ID
    quantity: number;
}

export class CartService {
    async syncCart(userId: number, items: SyncCartItemDto[]) {
        // 1. Find or create cart for user
        const cart = await (prisma as any).cart.upsert({
            where: { userId },
            create: { userId },
            update: { abandonedEmailSent: false }, // Reset abandoned email status on activity
        });

        // 2. Clear existing items and replace with new ones
        // This is a simple sync strategy. For more complex merging, we'd need more logic.
        // Given the prompt implies "sync", replacing server state with client state (master) is acceptable for this use case.

        // Using transaction to ensure atomicity
        return await (prisma as any).$transaction(async (tx: any) => {
            // Delete old items
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            // Insert new items
            if (items.length > 0) {
                await tx.cartItem.createMany({
                    data: items.map(item => ({
                        cartId: cart.id,
                        productoId: Number(item.id),
                        quantity: item.quantity
                    }))
                });
            }

            // Update timestamp implicitly handled by @updatedAt on Cart update above? 
            // Upsert update triggers it.

            return tx.cart.findUnique({
                where: { id: cart.id },
                include: { items: { include: { producto: true } } }
            });
        });
    }

    async getCart(userId: number) {
        return await (prisma as any).cart.findUnique({
            where: { userId },
            include: { items: { include: { producto: true } } }
        });
    }
}
