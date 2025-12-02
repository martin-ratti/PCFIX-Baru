// src/application/use-cases/LoginUser.ts
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../infrastructure/repositories/IUserRepository';
import { ITokenService } from '../services/ITokenService';

export interface LoginDTO {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: ITokenService
  ) {}

  async execute(data: LoginDTO) {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(data.email);
    
    // Por seguridad, usamos el mismo mensaje de error si no existe o si la clave está mal
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // 2. Verificar contraseña (comparar texto plano con hash)
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    // 3. Generar Token (Payload mínimo)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = this.tokenService.generate(payload);

    // 4. Retornar usuario limpio y el token
    const { password, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }
}