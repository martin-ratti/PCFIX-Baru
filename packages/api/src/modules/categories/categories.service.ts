import { prisma } from '../../shared/database/prismaClient';

export class CategoryService {
  
  // Obtener árbol completo
  async findAll() {
    return await prisma.categoria.findMany({
      where: { padreId: null }, // Traemos solo las raíces
      include: { 
        subcategorias: {
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
        padreId: padreId || null
      }
    });
  }

  async delete(id: number) {
    // Opcional: Validar si tiene productos o hijos antes de borrar
    return await prisma.categoria.delete({ where: { id } });
  }
}