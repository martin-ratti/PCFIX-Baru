import { prisma } from '../../shared/database/prismaClient';

export class CategoryService {
  
  // Obtener árbol completo (Raíces + Hijos)
  async findAll() {
    return await prisma.categoria.findMany({
      where: { padreId: null }, // Traemos solo las raíces
      include: { 
        subcategorias: { // Prisma ahora reconoce 'subcategorias'
          orderBy: { nombre: 'asc' }
        } 
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // Obtener lista plana (para los selects del admin)
  async findAllFlat() {
    return await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async create(nombre: string, padreId?: number) {
    return await prisma.categoria.create({
      data: {
        nombre,
        padreId: padreId || null // Prisma ahora reconoce 'padreId'
      }
    });
  }

  async delete(id: number) {
    // Si la categoría tiene productos asociados o subcategorías, la DB dará error 500
    // ya que la restricción de llave foránea impide el borrado (lo cual es bueno).
    return await prisma.categoria.delete({ where: { id } });
  }
}