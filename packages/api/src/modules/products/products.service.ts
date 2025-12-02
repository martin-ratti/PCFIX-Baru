import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

export class ProductService {
  
  // Modificado para excluir los eliminados (Soft Delete)
  async findAll(categoryId?: number) {
    return await prisma.producto.findMany({
      where: {
        deletedAt: null, // SOLO traemos los que NO tienen fecha de borrado
        ...(categoryId ? { categoriaId: categoryId } : {})
      },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Modificado para no encontrar productos borrados
  async findById(id: number) {
    return await prisma.producto.findFirst({ // findUnique cambia a findFirst para usar filtros
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
        stock: data.stock,
        foto: data.foto,
        categoriaId: data.categoriaId
      }
    });
  }

  // IMPLEMENTACIÓN SOFT DELETE
  async delete(id: number) {
    // En lugar de .delete(), hacemos .update()
    return await prisma.producto.update({
      where: { id },
      data: { 
        deletedAt: new Date() // Marcamos el momento exacto de la baja
      }
    });
  }
}