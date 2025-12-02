import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database/prismaClient';
import { JwtTokenService } from '../../shared/services/JwtTokenService';

// Tipos locales
interface RegisterDTO {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  private tokenService: JwtTokenService;

  constructor() {
    this.tokenService = new JwtTokenService();
  }

  async register(data: RegisterDTO) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('El email ya está registrado');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    // 1. Si no existe el usuario
    if (!user) throw new Error('Credenciales inválidas');

    // 2. CORRECCIÓN: Si el usuario existe pero NO tiene password (ej. se registró con Google)
    if (!user.password) {
      throw new Error('Esta cuenta usa inicio de sesión social (Google). Por favor inicia sesión con ese método.');
    }

    // 3. Ahora TypeScript sabe que user.password es string seguro
    const isMatch = await bcrypt.compare(data.password, user.password);
    
    if (!isMatch) throw new Error('Credenciales inválidas');

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}