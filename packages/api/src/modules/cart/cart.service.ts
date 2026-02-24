import { prisma } from '../../shared/database/prismaClient';

export interface SyncCartItemDto {
    id: string; 
    quantity: number;
}

export class CartService {
    async syncCart(userId: number, items: SyncCartItemDto[]) {
        
        const cart = await (prisma as any).cart.upsert({
            where: { userId },
            create: { userId },
            update: { abandonedEmailSent: false },
        });

        
        let validItems: SyncCartItemDto[] = [];
        if (items.length > 0) {
            const productIds = items.map(i => Number(i.id)).filter(id => !isNaN(id));

            if (productIds.length > 0) {
                const existingProducts = await prisma.producto.findMany({
                    where: { id: { in: productIds }, deletedAt: null },
                    select: { id: true }
                });

                const existingIds = new Set(existingProducts.map(p => p.id));
                validItems = items.filter(i => existingIds.has(Number(i.id)));
            }
        }

        
        return await (prisma as any).$transaction(async (tx: any) => {
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            if (validItems.length > 0) {
                await tx.cartItem.createMany({
                    data: validItems.map(item => ({
                        cartId: cart.id,
                        productoId: Number(item.id),
                        quantity: item.quantity
                    }))
                });
            }

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
