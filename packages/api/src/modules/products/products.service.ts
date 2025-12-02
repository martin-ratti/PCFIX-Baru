import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

export class ProductService {
  
  // Aceptamos lowStock como booleano opcional
  async findAll(categoryId?: number, lowStock?: boolean) {
    return await prisma.producto.findMany({
      where: {
        deletedAt: null,
        ...(categoryId ? { categoriaId: categoryId } : {}),
        ...(lowStock ? { stock: { lte: 5 } } : {}) // Si es true, filtra stock <= 5
      },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: number) {
    return await prisma.producto.findFirst({ 
      where: { 
        id,
        deletedAt: null 
      },
      include: { categoria: true }
    });
  }

  async create(data: CreateProductDTO) {
    const categoria = await prisma.categoria.findUnique({
      where: { id: data.categoriaId }
    });

    if (!categoria) {
      throw new Error('La categoría especificada no existe');
    }

    return await prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        precioOriginal: data.precioOriginal, 
        stock: data.stock,
        foto: data.foto,
        categoriaId: data.categoriaId
      }
    });
  }

  async update(id: number, data: Partial<CreateProductDTO>) {
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
        categoriaId: data.categoriaId
      }
    });
  }

  async delete(id: number) {
    return await prisma.producto.update({
      where: { id },
      data: { 
        deletedAt: new Date() 
      }
    });
  }
}