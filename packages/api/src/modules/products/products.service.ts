import { prisma } from '../../shared/database/prismaClient';
import { CreateProductDTO } from './products.schema';

type ProductInput = CreateProductDTO & { isFeatured?: boolean };

export class ProductService {
  
  async findAll(categoryId?: number, lowStock?: boolean, search?: string) {
    // 1. Construimos el filtro base de Prisma
    const whereClause: any = {
      deletedAt: null,
      ...(categoryId ? { categoriaId: categoryId } : {}),
      ...(lowStock ? { stock: { lte: 5 } } : {}),
    };

    // 2. Si hay búsqueda, pedimos a la DB que traiga coincidencias generales (loose matching)
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.producto.findMany({
      where: whereClause,
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });

    // 3. REFINAMIENTO (Lógica "i9" vs "9")
    // Filtramos en memoria para asegurar que el match sea al INICIO de alguna palabra
    if (search) {
      const term = search.toLowerCase();
      return products.filter(p => {
        // Juntamos nombre y descripción
        const text = `${p.nombre} ${p.descripcion}`.toLowerCase();
        // Separamos por espacios y revisamos si ALGUNA palabra EMPIEZA con el término
        const words = text.split(/[\s\-_.,;]+/); // Divide por espacio, guion, punto, etc.
        return words.some(w => w.startsWith(term));
      });
    }

    return products;
  }

  // ... resto de los métodos (findById, create, update, delete) IGUALES ...
  async findById(id: number) { return await prisma.producto.findFirst({ where: { id, deletedAt: null }, include: { categoria: true } }); }
  async create(data: ProductInput) { const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } }); if (!categoria) throw new Error('Categoría no encontrada'); return await prisma.producto.create({ data: { nombre: data.nombre, descripcion: data.descripcion, precio: data.precio, precioOriginal: data.precioOriginal, stock: data.stock, foto: data.foto, isFeatured: data.isFeatured || false, categoriaId: data.categoriaId } }); }
  async update(id: number, data: Partial<ProductInput>) { const exists = await this.findById(id); if (!exists) throw new Error('Producto no encontrado'); return await prisma.producto.update({ where: { id }, data: { nombre: data.nombre, descripcion: data.descripcion, precio: data.precio, precioOriginal: data.precioOriginal, stock: data.stock, foto: data.foto, isFeatured: data.isFeatured, categoriaId: data.categoriaId } }); }
  async delete(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } }); }
}