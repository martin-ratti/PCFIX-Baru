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

    // CORRECCIÓN: productId es el argumento, productoId es el campo de la DB
    async toggleFavorite(userId: number, productId: number) {
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_productoId: {
                    userId,
                    productoId: productId, // Asignamos el argumento al campo
                }
            }
        });

        if (existingFavorite) {
            await prisma.favorite.delete({
                where: {
                    userId_productoId: { userId, productoId: productId }
                }
            });
            return { added: false, message: 'Producto eliminado de favoritos' };
        } else {
            await prisma.favorite.create({
                data: { userId, productoId: productId }
            });
            return { added: true, message: 'Producto agregado a favoritos' };
        }
    }
}