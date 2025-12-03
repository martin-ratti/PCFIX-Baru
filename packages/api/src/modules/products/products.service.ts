import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

type ProductInput = CreateProductDTO & { isFeatured?: boolean; marcaId?: number | null };

export class ProductService {
  
  async findAll(
    categoryId?: number, 
    marcaId?: number, 
    lowStock?: boolean, 
    search?: string, 
    page: number = 1, 
    limit: number = 10, // Por defecto 10 items por página
    isFeatured?: boolean, 
    hasDiscount?: boolean
  ) {
    const skip = (page - 1) * limit;

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

    // Ejecutamos dos consultas en una sola transacción de base de datos
    const [total, products] = await prisma.$transaction([
      prisma.producto.count({ where: whereClause }),
      prisma.producto.findMany({
        where: whereClause,
        include: { categoria: true, marca: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      })
    ]);

    // Refinamiento de búsqueda exacta en memoria (solo si es necesario por lógica de negocio estricta)
    // Nota: Al paginar, el filtrado en memoria puede ser confuso porque filtra SOLO la página actual.
    // Para sistemas profesionales con paginación, solemos confiar en el 'contains' de la DB.
    // Si mantienes el filtro de JS, hazlo sabiendo que reduce el tamaño de la página retornada.
    
    let resultData = products;

    if (search) {
       const term = search.toLowerCase();
       // Opcional: Si quieres mantener tu lógica estricta de "empieza con", mantén esto.
       // Si prefieres rendimiento puro, deja que la DB maneje el 'contains'.
       resultData = products.filter(p => {
        const text = `${p.nombre} ${p.descripcion}`.toLowerCase();
        const words = text.split(/[\s\-_.,;]+/);
        return words.some(w => w.startsWith(term));
      });
    }

    return {
      data: resultData,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit
      }
    };
  }

  // ... resto de métodos (findById, create, etc. sin cambios) ...
  async findById(id: number) { return await prisma.producto.findFirst({ where: { id, deletedAt: null }, include: { categoria: true, marca: true } }); }
  async create(data: ProductInput) { const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } }); if (!categoria) throw new Error('Categoría no encontrada'); return await prisma.producto.create({ data: { nombre: data.nombre, descripcion: data.descripcion, precio: data.precio, precioOriginal: data.precioOriginal, stock: data.stock, foto: data.foto, isFeatured: data.isFeatured || false, categoriaId: data.categoriaId, marcaId: data.marcaId || null } }); }
  async update(id: number, data: Partial<ProductInput>) { const exists = await this.findById(id); if (!exists) throw new Error('Producto no encontrado'); return await prisma.producto.update({ where: { id }, data: { nombre: data.nombre, descripcion: data.descripcion, precio: data.precio, precioOriginal: data.precioOriginal, stock: data.stock, foto: data.foto, isFeatured: data.isFeatured, categoriaId: data.categoriaId, marcaId: data.marcaId } }); }
  async delete(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } }); }
}