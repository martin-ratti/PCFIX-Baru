import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';

export class ProductService {
  
  // --- HELPER: Obtener IDs de categorías hijas recursivamente ---
  private async getCategoryIdsRecursively(rootId: number): Promise<number[]> {
      // 1. Buscamos hijos directos
      const children = await prisma.categoria.findMany({
          where: { padreId: rootId },
          select: { id: true }
      });
      
      let ids = [rootId]; // Incluimos la categoría padre
      
      for (const child of children) {
          // 2. Llamada recursiva para nietos, bisnietos, etc.
          const subIds = await this.getCategoryIdsRecursively(child.id);
          ids = [...ids, ...subIds];
      }
      
      return ids;
  }

  // --- 1. LISTAR CON FILTROS (Admin & Store) ---
  async findAll(page: number = 1, limit: number = 10, categoryId?: number, brandId?: number, search?: string, filter?: string) {
    const skip = (page - 1) * limit;
    
    // Filtro Base: No mostramos eliminados
    const where: Prisma.ProductoWhereInput = { deletedAt: null };

    // 1. Búsqueda por Texto (Nombre o Descripción)
    if (search) {
        where.OR = [
            { nombre: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } }
        ];
    }

    // 2. Filtro por Categoría (Recursivo)
    if (categoryId) {
        const categoryIds = await this.getCategoryIdsRecursively(categoryId);
        where.categoriaId = { in: categoryIds };
    }

    // 3. Filtro por Marca
    if (brandId) {
        where.marcaId = brandId;
    }

    // 4. Filtros Especiales (Stock Bajo, Ofertas, Destacados)
    if (filter === 'lowStock') {
        // Stock menor o igual a 5, pero ignoramos servicios (stock > 90000)
        where.stock = { lte: 5 }; 
    }
    if (filter === 'featured') {
        where.isFeatured = true;
    }
    if (filter === 'hasDiscount') {
        where.precioOriginal = { not: null };
    }

    // Ejecutar consulta y conteo en paralelo
    const [total, products] = await prisma.$transaction([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
            where,
            include: { 
                categoria: true, 
                marca: true 
            },
            orderBy: { createdAt: 'desc' }, // Más nuevos primero
            take: limit,
            skip
        })
    ]);

    return {
        data: products,
        meta: { 
            total, 
            page, 
            lastPage: Math.ceil(total / limit), 
            limit 
        }
    };
  }

  // --- 2. BUSCAR POR ID ---
  async findById(id: number) {
    return await prisma.producto.findFirst({
      where: { id, deletedAt: null },
      include: { categoria: true, marca: true }
    });
  }

  // --- 3. CREAR PRODUCTO ---
  async create(data: any) {
    // Parseamos números por seguridad
    const precio = Number(data.precio);
    const stock = Number(data.stock);
    const categoriaId = Number(data.categoriaId);
    const marcaId = data.marcaId ? Number(data.marcaId) : null;
    
    // Logística (defaults)
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
        // Campos logísticos
        peso,
        alto,
        ancho,
        profundidad
      }
    });
  }

  // --- 4. ACTUALIZAR PRODUCTO ---
  async update(id: number, data: any) {
    const updateData: any = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: Number(data.precio),
        stock: Number(data.stock),
        categoriaId: Number(data.categoriaId),
        marcaId: data.marcaId ? Number(data.marcaId) : null,
        // Logística
        peso: Number(data.peso),
        alto: Number(data.alto),
        ancho: Number(data.ancho),
        profundidad: Number(data.profundidad)
    };

    // Solo actualizamos foto si viene una nueva
    if (data.foto) {
        updateData.foto = data.foto;
    }

    return await prisma.producto.update({
      where: { id },
      data: updateData
    });
  }

  // --- 5. ELIMINAR (Soft Delete) ---
  async delete(id: number) {
    return await prisma.producto.update({
      where: { id },
      data: { deletedAt: new Date() } // No borramos registro, solo marcamos fecha
    });
  }

  // --- 6. RESTAURAR (Opcional, por si borraste por error) ---
  async restore(id: number) {
      return await prisma.producto.update({
          where: { id },
          data: { deletedAt: null }
      });
  }
}