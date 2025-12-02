// src/application/use-cases/RegisterUser.ts
import bcrypt from 'bcryptjs';
import { IUserRepository, CreateUserDTO } from '../../infrastructure/repositories/IUserRepository';

export class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO) {
    // 1. Verificar si el usuario ya existe (Regla de Negocio)
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // 2. Encriptar la contraseña (Seguridad)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 3. Crear el usuario con la contraseña encriptada
    const newUser = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // 4. Retornar el usuario SIN la contraseña (DTO de respuesta)
    // Usamos destructuring para excluir el password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}