import { prisma } from '../../shared/database/prismaClient';
// Importamos la interfaz del schema o la definimos aquí para extenderla
import { CreateProductDTO } from './products.schema';

// Extendemos el DTO localmente para incluir isFeatured si no está en el archivo schema base
type ProductInput = CreateProductDTO & { isFeatured?: boolean };

export class ProductService {
  
  async findAll(categoryId?: number, lowStock?: boolean) {
    return await prisma.producto.findMany({
      where: {
        deletedAt: null,
        ...(categoryId ? { categoriaId: categoryId } : {}),
        ...(lowStock ? { stock: { lte: 5 } } : {})
      },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: number) {
    return await prisma.producto.findFirst({ 
      where: { id, deletedAt: null },
      include: { categoria: true }
    });
  }

  async create(data: ProductInput) {
    const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
    if (!categoria) throw new Error('Categoría no encontrada');

    return await prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        precioOriginal: data.precioOriginal,
        stock: data.stock,
        foto: data.foto,
        isFeatured: data.isFeatured || false, // Guardamos el destacado
        categoriaId: data.categoriaId
      }
    });
  }

  async update(id: number, data: Partial<ProductInput>) {
    const exists = await this.findById(id);
    if (!exists) throw new Error('Producto no encontrado');

    return await prisma.producto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        precioOriginal: data.precioOriginal,
        stock: data.stock,
        foto: data.foto,
        isFeatured: data.isFeatured, // Actualizamos destacado
        categoriaId: data.categoriaId
      }
    });
  }

  async delete(id: number) {
    return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}