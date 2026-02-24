import { prisma } from '../../shared/database/prismaClient';
import { Prisma } from '@prisma/client';

export class CategoryService {

  
  async findAll(flat: boolean = false) {

    const excludeServices: Prisma.CategoriaWhereInput = {
      NOT: {
        nombre: { contains: 'Servicio', mode: 'insensitive' }
      }
    };

    if (flat) {
      return await prisma.categoria.findMany({
        where: excludeServices,
        orderBy: { nombre: 'asc' }
      });
    }

    return await prisma.categoria.findMany({
      where: {
        padreId: null,
        ...excludeServices
      },
      include: {
        subcategorias: {
          where: excludeServices,
          orderBy: { nombre: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  async findById(id: number) {
    return await prisma.categoria.findUnique({ where: { id }, include: { subcategorias: true } });
  }

  async create(data: { nombre: string, padreId?: number | null }) {
    return await prisma.categoria.create({
      data: { nombre: data.nombre, padreId: data.padreId || null }
    });
  }

  async delete(id: number) {
    const productsCount = await prisma.producto.count({ where: { categoriaId: id } });
    if (productsCount > 0) throw new Error(`No se puede eliminar: Tiene ${productsCount} productos.`);
    return await prisma.categoria.delete({ where: { id } });
  }
}