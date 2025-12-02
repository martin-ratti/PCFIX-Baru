import { prisma } from '../../shared/database/prismaClient';

export class BrandService {
  async findAll() {
    return await prisma.marca.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async create(nombre: string, logo?: string) {
    const existing = await prisma.marca.findUnique({ where: { nombre } });
    if (existing) throw new Error('La marca ya existe');

    return await prisma.marca.create({
      data: { nombre, logo }
    });
  }
  
  async delete(id: number) {
    return await prisma.marca.delete({ where: { id } });
  }
}