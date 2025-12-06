import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';

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

  // --- 1. LISTAR TODO (Con parámetro SORT) ---
  async findAll(
      page: number = 1, 
      limit: number = 10, 
      categoryId?: number, 
      brandId?: number, 
      search?: string, 
      filter?: string,
      sort?: string // 👈 NUEVO: Recibimos el orden
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductoWhereInput = { deletedAt: null };

    // Filtros
    if (search) {
        where.OR = [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
            { id: !isNaN(Number(search)) ? Number(search) : undefined }
        ];
    }
    if (categoryId) {
        const categoryIds = await this.getCategoryIdsRecursively(categoryId);
        where.categoriaId = { in: categoryIds };
    }
    if (brandId) where.marcaId = brandId;
    if (filter === 'lowStock') where.stock = { lte: 5 }; 
    if (filter === 'featured') where.isFeatured = true;
    if (filter === 'hasDiscount') where.precioOriginal = { not: null };

    // 👇 LÓGICA DE ORDENAMIENTO (Aquí ocurre la magia)
    let orderBy: Prisma.ProductoOrderByWithRelationInput = { createdAt: 'desc' }; // Por defecto: Lo más nuevo

    if (sort === 'price_asc') orderBy = { precio: 'asc' };       // Menor precio
    else if (sort === 'price_desc') orderBy = { precio: 'desc' }; // Mayor precio
    else if (sort === 'name_asc') orderBy = { nombre: 'asc' };    // A-Z

    const [total, products] = await prisma.$transaction([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
            where,
            include: { categoria: true, marca: true },
            orderBy, // 👈 Aplicamos el orden
            take: limit,
            skip
        })
    ]);

    return {
        data: products,
        meta: { total, page, lastPage: Math.ceil(total / limit), limit }
    };
  }

  // --- 2. LISTAR POS (Sin cambios, para que siga funcionando el POS) ---
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

  // ... (Resto de métodos: findById, create, update, delete se mantienen igual)
  async findById(id: number) { return await prisma.producto.findFirst({ where: { id, deletedAt: null }, include: { categoria: true, marca: true } }); }
  async create(data: any) { return await prisma.producto.create({ data: { nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), stock: Number(data.stock), foto: data.foto, categoriaId: Number(data.categoriaId), marcaId: data.marcaId ? Number(data.marcaId) : null, peso: Number(data.peso||0.5), alto: Number(data.alto||10), ancho: Number(data.ancho||10), profundidad: Number(data.profundidad||10) } }); }
  async update(id: number, data: any) { const updateData: any = { ...data, precio: Number(data.precio), stock: Number(data.stock), categoriaId: Number(data.categoriaId) }; if (data.foto) updateData.foto = data.foto; return await prisma.producto.update({ where: { id }, data: updateData }); }
  async delete(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: new Date() } }); }
  async restore(id: number) { return await prisma.producto.update({ where: { id }, data: { deletedAt: null } }); }
}