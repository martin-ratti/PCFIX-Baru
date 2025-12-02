// src/infrastructure/repositories/PrismaUserRepository.ts
import { IUserRepository, CreateUserDTO } from './IUserRepository';
import { prisma } from '../database/prismaClient';
import { User } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {
  async create(data: CreateUserDTO): Promise<User> {
    // Usamos Prisma para crear el registro
    return await prisma.user.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        password: data.password,
        role: 'USER', // Por defecto todos son usuarios normales
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }
}