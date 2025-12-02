// src/domain/repositories/IUserRepository.ts
import { User } from '@prisma/client';

// Definimos los datos necesarios para crear un usuario (sin ID ni fechas)
export interface CreateUserDTO {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
}

// Contrato que cualquier base de datos debe cumplir
export interface IUserRepository {
  create(data: CreateUserDTO): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}