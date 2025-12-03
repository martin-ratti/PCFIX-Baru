import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

// Extendemos para incluir los nuevos campos de logística
type ProductInput = CreateProductDTO & { 
    isFeatured?: boolean; 
    marcaId?: number | null;
    peso?: number;
    alto?: number;
    ancho?: number;
    profundidad?: number;
};

export class ProductService {
  
  // ... findAll (igual que antes) ...
  async findAll(categoryId?: number, marcaId?: number, lowStock?: boolean, search?: string, limit?: number, isFeatured?: boolean, hasDiscount?: boolean) {
    const whereClause: any = {
      deletedAt: null,
      ...(categoryId ? { categoriaId: categoryId } : {}),
      ...(marcaId ? { marcaId: marcaId } : {}),
      ...(lowStock ? { stock: { lte: 5 } } : {}),
      ...(isFeatured ? { isFeatured: true } : {}),
      ...(hasDiscount ? { precioOriginal: { not: null } } : {}),
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.producto.findMany({
      where: whereClause,
      include: { categoria: true, marca: true },
      orderBy: { createdAt: 'desc' },
      take: limit || undefined
    });

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

  // ... findById (igual) ...
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
        marcaId: data.marcaId || null,
        // Nuevos campos
        peso: data.peso,
        alto: data.alto,
        ancho: data.ancho,
        profundidad: data.profundidad
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
        marcaId: data.marcaId,
        // Nuevos campos
        peso: data.peso,
        alto: data.alto,
        ancho: data.ancho,
        profundidad: data.profundidad
      }
    });
  }

  async delete(id: number) {
    return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}