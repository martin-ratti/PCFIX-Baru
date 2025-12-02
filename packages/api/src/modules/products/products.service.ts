import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

export class ProductService {
  
    async findAll(categoryId?: number) {
    return await prisma.producto.findMany({
      where: categoryId ? { categoriaId: categoryId } : {}, 
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: number) {
    return await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true }
    });
  }

  async create(data: CreateProductDTO) {
    // Verificamos si la categoría existe antes de crear
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
}