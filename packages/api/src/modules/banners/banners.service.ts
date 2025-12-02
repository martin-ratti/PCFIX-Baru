import { prisma } from '../../shared/database/prismaClient';

export class BannerService {
  async findAll() {
    return await prisma.banner.findMany({
      include: { marca: true }, // Incluimos los datos de la marca (para el nombre y el ID)
      orderBy: { createdAt: 'desc' } // Los más nuevos primero
    });
  }

  async create(marcaId: number, imagenUrl: string) {
    // Validar que la marca exista
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