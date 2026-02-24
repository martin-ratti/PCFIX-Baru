import { prisma } from '../../shared/database/prismaClient';

export class FavoriteService {

    async getFavoritesByUserId(userId: number) {
        return await prisma.favorite.findMany({
            where: { userId },
            include: {
                producto: {
                    include: {
                        categoria: true,
                        marca: true
                    }
                }
            }
        });
    }

    async toggleFavorite(userId: number, productId: number, forceState?: boolean) {
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_productoId: {
                    userId,
                    productoId: productId,
                }
            }
        });

        
        
        
        const shouldAdd = forceState !== undefined ? forceState : !existingFavorite;

        if (existingFavorite && !shouldAdd) {
            await prisma.favorite.delete({
                where: {
                    userId_productoId: { userId, productoId: productId }
                }
            });
            return { added: false, message: 'Producto eliminado de favoritos' };
        } else if (!existingFavorite && shouldAdd) {
            await prisma.favorite.create({
                data: { userId, productoId: productId }
            });
            return { added: true, message: 'Producto agregado a favoritos' };
        }

        
        return { added: shouldAdd, message: shouldAdd ? 'Producto ya estaba en favoritos' : 'Producto ya estaba eliminado' };
    }
}