import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';
import { EmailService } from '../../shared/services/EmailService';

export class ProductService {

    private async getCategoryIdsRecursively(rootId: number): Promise<number[]> {
        const children = await prisma.categoria.findMany({ where: { padreId: rootId }, select: { id: true } });
        let ids = [rootId];
        for (const child of children) {
            const subIds = await this.getCategoryIdsRecursively(child.id);
            ids = [...ids, ...subIds];
        }
        return ids;
    }


    async findAll(
        page: number = 1,
        limit: number = 10,
        categoryId?: number,
        brandId?: number,
        search?: string,
        filter?: string,
        sort?: string,
        selectMinimal: boolean = false
    ) {
        const skip = (page - 1) * limit;
        const where: Prisma.ProductoWhereInput = { deletedAt: null };


        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } },
                { id: !isNaN(Number(search)) ? Number(search) : undefined }
            ];
        }


        where.nombre = { not: 'Servicio: Servicio Personalizado' };

        if (categoryId) {
            const categoryIds = await this.getCategoryIdsRecursively(categoryId);
            where.categoriaId = { in: categoryIds };
        }
        if (brandId) where.marcaId = brandId;
        if (filter === 'lowStock') where.stock = { lte: 5 };
        if (filter === 'featured') where.isFeatured = true;
        if (filter === 'hasDiscount') where.precioOriginal = { not: null };


        let orderBy: Prisma.ProductoOrderByWithRelationInput = { createdAt: 'desc' };

        if (sort === 'price_asc') orderBy = { precio: 'asc' };
        else if (sort === 'price_desc') orderBy = { precio: 'desc' };
        else if (sort === 'name_asc') orderBy = { nombre: 'asc' };

        const queryOptions: any = {
            where,
            orderBy,
            take: limit,
            skip
        };

        if (selectMinimal) {
            queryOptions.select = {
                id: true,
                nombre: true,
                precio: true,
                foto: true,
                categoria: { select: { nombre: true } }
            };
        } else {
            queryOptions.include = { categoria: true, marca: true };
        }

        const [total, products] = await prisma.$transaction([
            prisma.producto.count({ where }),
            prisma.producto.findMany(queryOptions)
        ]);

        return {
            data: products,
            meta: { total, page, lastPage: Math.ceil(total / limit), limit }
        };
    }


    async findAllPOS(search?: string, limit: number = 20) {
        const where: Prisma.ProductoWhereInput = { deletedAt: null };
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { id: !isNaN(Number(search)) ? Number(search) : undefined },
                { categoria: { nombre: { contains: search, mode: 'insensitive' } } }
            ];
        }
        return await prisma.producto.findMany({
            where,
            include: { categoria: true, marca: true },
            orderBy: { nombre: 'asc' },
            take: limit
        });
    }

    async findById(id: number) { return await prisma.producto.findFirst({ where: { id, deletedAt: null }, include: { categoria: true, marca: true } }); }
    async create(data: any) { return await prisma.producto.create({ data: { nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), stock: Number(data.stock), foto: data.foto, categoriaId: Number(data.categoriaId), marcaId: data.marcaId ? Number(data.marcaId) : null, peso: Number(data.peso || 0.5), alto: Number(data.alto || 10), ancho: Number(data.ancho || 10), profundidad: Number(data.profundidad || 10) } }); }
    async update(id: number, data: any) {

        const updateData: any = { ...data };

        if (data.precio !== undefined) updateData.precio = Number(data.precio);
        if (data.stock !== undefined) updateData.stock = Number(data.stock);
        if (data.categoriaId !== undefined) updateData.categoriaId = Number(data.categoriaId);
        if (data.marcaId !== undefined) updateData.marcaId = data.marcaId ? Number(data.marcaId) : null;


        if (data.peso !== undefined) updateData.peso = Number(data.peso);
        if (data.alto !== undefined) updateData.alto = Number(data.alto);
        if (data.ancho !== undefined) updateData.ancho = Number(data.ancho);
        if (data.profundidad !== undefined) updateData.profundidad = Number(data.profundidad);

        if (data.foto) updateData.foto = data.foto;


        const currentProduct = await prisma.producto.findUnique({ where: { id } });
        const oldStock = currentProduct?.stock || 0;
        const oldPrice = Number(currentProduct?.precio || 0);

        const updatedProduct = await prisma.producto.update({ where: { id }, data: updateData });


        const newStock = updatedProduct.stock;
        if (oldStock === 0 && newStock > 0) {
            this.processStockAlerts(updatedProduct);
        }


        const newPrice = Number(updatedProduct.precio);
        if (oldPrice > 0 && newPrice < oldPrice) {
            this.processPriceDropAlerts(updatedProduct, oldPrice, newPrice);
        }

        return updatedProduct;
    }


    private async processStockAlerts(product: any) {
        try {
            const alerts = await (prisma as any).stockAlert.findMany({
                where: { productoId: product.id }
            });

            if (alerts.length === 0) return;

            if (alerts.length === 0) return;

            const emailService = new EmailService();

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
            const productLink = `${frontendUrl}/tienda/producto/${product.id}`;

            for (const alert of alerts) {
                await emailService.sendStockAlertEmail(
                    alert.email,
                    product.nombre,
                    productLink,
                    product.foto,
                    Number(product.precio)
                );
            }


            await (prisma as any).stockAlert.deleteMany({
                where: { productoId: product.id }
            });

        } catch (error) {
            console.error('Error procesando alertas de stock:', error);
        }
    }


    private async processPriceDropAlerts(product: any, oldPrice: number, newPrice: number) {
        try {

            const favorites = await prisma.favorite.findMany({
                where: { productoId: product.id },
                include: { user: true }
            });

            if (favorites.length === 0) return;

            const emailService = new EmailService();

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
            const productLink = `${frontendUrl}/tienda/producto/${product.id}`;





            await Promise.all(favorites.map(fav => {
                if (fav.user.email) {
                    return emailService.sendPriceDropNotification(
                        fav.user.email,
                        product.nombre,
                        productLink,
                        product.foto,
                        oldPrice,
                        newPrice
                    ).catch((e: any) => console.error(`Error enviando alerta precio a ${fav.user.email}:`, e));
                }
                return Promise.resolve();
            }));

        } catch (error) {
            console.error('Error procesando alertas de bajada de precio:', error);
        }
    }


    async findBestSellers(limit: number = 10) {

        const bestSellers = await prisma.$queryRaw<{ productoId: number; totalSold: bigint }[]>`
            SELECT lv."productoId", SUM(lv.cantidad) as "totalSold"
            FROM "LineaVenta" lv
            INNER JOIN "Venta" v ON lv."ventaId" = v.id
            WHERE v.estado NOT IN ('CANCELADO')
            GROUP BY lv."productoId"
            ORDER BY "totalSold" DESC
            LIMIT ${limit}
        `;

        if (bestSellers.length === 0) {

            return await prisma.producto.findMany({
                where: {
                    deletedAt: null,
                    isFeatured: true,
                    nombre: { not: 'Servicio: Servicio Personalizado' }
                },
                include: { categoria: true, marca: true },
                take: limit
            });
        }

        const productIds = bestSellers.map(bs => bs.productoId);


        const products = await prisma.producto.findMany({
            where: {
                id: { in: productIds },
                deletedAt: null,
                nombre: { not: 'Servicio: Servicio Personalizado' }
            },
            include: { categoria: true, marca: true }
        });


        const orderedProducts = productIds
            .map(id => products.find(p => p.id === id))
            .filter(Boolean);

        return orderedProducts;
    }

    async delete(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } }); }
    async restore(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: null } }); }
}