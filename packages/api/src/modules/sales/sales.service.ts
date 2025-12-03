import { prisma } from '../../shared/database/prismaClient';

export class SalesService {
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [total, sales] = await prisma.$transaction([
      prisma.venta.count(),
      prisma.venta.findMany({
        include: {
          cliente: { include: { user: true } },
          pagos: true
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: skip
      })
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit
      }
    };
  }
}