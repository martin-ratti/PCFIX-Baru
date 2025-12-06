import { prisma } from '../../shared/database/prismaClient';

export class BannerService {
  async findAll() {
    return await prisma.banner.findMany({
      include: { marca: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(marcaId: number, imagenUrl: string) {
    const marca = await prisma.marca.findUnique({ where: { id: marcaId } });
    if (!marca) throw new Error('La marca especificada no existe');

    return await prisma.banner.create({
      data: {
        marcaId,
        imagen: imagenUrl
      }
    });
  }

  async delete(id: number) {
    return await prisma.banner.delete({ where: { id } });
  }
}