import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';

export class CategoryService {
  
  // 1. Obtener todas (para el menú y listados)
  async findAll(flat: boolean = false) {
    
    // 🔥 CORRECCIÓN DEL ERROR "Unknown argument mode":
    // Usamos el operador lógico NOT de nivel raíz.
    // Esto excluye cualquier categoría que contenga "Servicio" (mayúscula o minúscula)
    const excludeServices: Prisma.CategoriaWhereInput = {
        NOT: {
            nombre: { contains: 'Servicio', mode: 'insensitive' }
        }
    };

    if (flat) {
      // Retorna lista plana (solo las que no son servicios)
      return await prisma.categoria.findMany({
          where: excludeServices,
          orderBy: { nombre: 'asc' }
      });
    }

    // Retorna árbol jerárquico (Padres -> Hijos)
    return await prisma.categoria.findMany({
      where: { 
          padreId: null,      // Solo raíces
          ...excludeServices  // Y que no sean servicios
      },
      include: { 
          subcategorias: {
              // También filtramos las subcategorías por seguridad
              where: excludeServices,
              orderBy: { nombre: 'asc' }
          }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // 2. Obtener una por ID
  async findById(id: number) {
    return await prisma.categoria.findUnique({
      where: { id },
      include: { subcategorias: true }
    });
  }

  // 3. Crear (Solo Admin)
  async create(data: { nombre: string, padreId?: number | null }) {
    return await prisma.categoria.create({
      data: {
        nombre: data.nombre,
        padreId: data.padreId || null
      }
    });
  }

  // 4. Eliminar (Solo Admin)
  async delete(id: number) {
    // Validamos si tiene productos
    const productsCount = await prisma.producto.count({ where: { categoriaId: id } });
    if (productsCount > 0) {
        throw new Error(`No se puede eliminar: Esta categoría tiene ${productsCount} productos.`);
    }

    return await prisma.categoria.delete({
      where: { id }
    });
  }
}