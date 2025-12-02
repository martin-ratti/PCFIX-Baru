import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

// Tipo extendido para incluir campos opcionales de lógica
type ProductInput = CreateProductDTO & { isFeatured?: boolean; marcaId?: number | null };

export class ProductService {
  
  // CORRECCIÓN: Ahora acepta los 4 parámetros correctamente
  async findAll(categoryId?: number, marcaId?: number, lowStock?: boolean, search?: string) {
    const whereClause: any = {
      deletedAt: null,
      ...(categoryId ? { categoriaId: categoryId } : {}),
      ...(marcaId ? { marcaId: marcaId } : {}), // Filtro de marca
      ...(lowStock ? { stock: { lte: 5 } } : {}),
    };

    // Filtro de búsqueda en base de datos (parcial)
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.producto.findMany({
      where: whereClause,
      include: { categoria: true, marca: true },
      orderBy: { createdAt: 'desc' }
    });

    // Refinamiento de búsqueda en memoria (Prefijo de palabra)
    if (search) {
      const term = search.toLowerCase();
      return products.filter(p => {
        const text = `${p.nombre} ${p.descripcion}`.toLowerCase();
        const words = text.split(/[\s\-_.,;]+/);
        return words.some(w => w.startsWith(term));
      });
    }

    return products;
  }

  async findById(id: number) {
    return await prisma.producto.findFirst({ 
      where: { id, deletedAt: null },
      include: { categoria: true, marca: true }
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
        isFeatured: data.isFeatured || false,
        categoriaId: data.categoriaId,
        marcaId: data.marcaId || null
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
        isFeatured: data.isFeatured,
        categoriaId: data.categoriaId,
        marcaId: data.marcaId
      }
    });
  }

  async delete(id: number) {
    return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}