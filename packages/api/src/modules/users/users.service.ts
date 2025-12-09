import { prisma } from '../../shared/database/prismaClient';

export class UserService {

  async findById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        googleId: true,
        createdAt: true
      }
    });
  }

  async update(id: number, data: { nombre: string; apellido: string }) {
    return await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nombre: true, apellido: true, email: true, role: true }
    });
  }
}