import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';

export class ProductService {
  
  // --- HELPER: Obtener IDs de categorías hijas recursivamente ---
  private async getCategoryIdsRecursively(rootId: number): Promise<number[]> {
      const children = await prisma.categoria.findMany({
          where: { padreId: rootId },
          select: { id: true }
      });
      
      let ids = [rootId]; 
      
      for (const child of children) {
          const subIds = await this.getCategoryIdsRecursively(child.id);
          ids = [...ids, ...subIds];
      }
      
      return ids;
  }

  // --- 1. LISTAR CON FILTROS (Admin & Store) ---
  async findAll(
      page: number = 1, 
      limit: number = 10, 
      categoryId?: number, 
      brandId?: number, 
      search?: string, 
      filter?: string,
      isAdmin: boolean = false 
  ) {
    const skip = (page - 1) * limit;
    
    // Filtro Base
    const where: Prisma.ProductoWhereInput = { deletedAt: null };

    // 🔒 CORRECCIÓN DEFINITIVA: Ocultar Servicios
    // Usamos 'isNot' en la relación de categoría.
    // Esto se lee: "Traeme productos donde la categoría NO SEA una que contenga 'Servicio'"
    if (!isAdmin) {
        where.categoria = {
            isNot: {
                nombre: { contains: 'Servicio', mode: 'insensitive' }
            }
        };
    }

    // 1. Búsqueda por Texto
    if (search) {
        where.OR = [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } }
        ];
    }

    // 2. Filtro por Categoría (Recursivo)
    if (categoryId) {
        const categoryIds = await this.getCategoryIdsRecursively(categoryId);
        
        // Combinación inteligente de filtros (AND)
        // Si ya tenemos el filtro de "No Servicios", lo combinamos con el de "Categoría Específica"
        if (where.categoria) {
            where.AND = [
                { categoria: where.categoria }, // Mantiene la exclusión de servicios
                { categoriaId: { in: categoryIds } } // Aplica la selección del usuario
            ];
            delete where.categoria; // Limpiamos la propiedad raíz para evitar conflictos
        } else {
            where.categoriaId = { in: categoryIds };
        }
    }

    // 3. Filtro por Marca
    if (brandId) {
        where.marcaId = brandId;
    }

    // 4. Filtros Especiales
    if (filter === 'lowStock') where.stock = { lte: 5 }; 
    if (filter === 'featured') where.isFeatured = true;
    if (filter === 'hasDiscount') where.precioOriginal = { not: null };

    // Ejecutar consulta
    const [total, products] = await prisma.$transaction([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
            where,
            include: { categoria: true, marca: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        })
    ]);

    return {
        data: products,
        meta: { total, page, lastPage: Math.ceil(total / limit), limit }
    };
  }

  // --- RESTO DE MÉTODOS (Sin cambios) ---
  
  async findById(id: number) {
    return await prisma.producto.findFirst({
      where: { id, deletedAt: null },
      include: { categoria: true, marca: true }
    });
  }

  async create(data: any) {
    const precio = Number(data.precio);
    const stock = Number(data.stock);
    const categoriaId = Number(data.categoriaId);
    const marcaId = data.marcaId ? Number(data.marcaId) : null;
    
    const peso = data.peso ? Number(data.peso) : 0.5;
    const alto = data.alto ? Number(data.alto) : 10;
    const ancho = data.ancho ? Number(data.ancho) : 10;
    const profundidad = data.profundidad ? Number(data.profundidad) : 10;

    return await prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio,
        stock,
        foto: data.foto,
        categoriaId,
        marcaId,
        peso, alto, ancho, profundidad
      }
    });
  }

  async update(id: number, data: any) {
    const updateData: any = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        stock: Number(data.stock),
        categoriaId: Number(data.categoriaId),
        marcaId: data.marcaId ? Number(data.marcaId) : null,
        peso: Number(data.peso),
        alto: Number(data.alto),
        ancho: Number(data.ancho),
        profundidad: Number(data.profundidad)
    };

    if (data.foto) updateData.foto = data.foto;

    return await prisma.producto.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: number) {
    return await prisma.producto.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async restore(id: number) {
      return await prisma.producto.update({
          where: { id },
          data: { deletedAt: null }
      });
  }
}