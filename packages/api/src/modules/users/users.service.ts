import { prisma } from '../../shared/database/prismaClient';

export class UserService {
  
  // Usado para "Mi Perfil"
  async findById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
      // Seleccionamos solo lo seguro, nada de passwords
      select: { 
        id: true, 
        nombre: true, 
        apellido: true, 
        email: true, 
        role: true, 
        createdAt: true 
      }
    });
  }

  // Usado para "Editar Perfil"
  async update(id: number, data: { nombre: string; apellido: string }) {
    return await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nombre: true, apellido: true, email: true, role: true }
    });
  }
}