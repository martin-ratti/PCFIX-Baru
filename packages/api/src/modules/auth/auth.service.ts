import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database/prismaClient'; // Ruta actualizada
import { JwtTokenService } from '../../shared/services/JwtTokenService'; // Lo moveremos en breve

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
    if (!user) throw new Error('Credenciales inválidas');

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