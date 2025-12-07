import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database/prismaClient';
import { JwtTokenService } from '../../shared/services/JwtTokenService';
import { OAuth2Client } from 'google-auth-library';

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
  private googleClient: OAuth2Client;

  constructor() {
    this.tokenService = new JwtTokenService();
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

    await prisma.cliente.create({ data: { userId: newUser.id } });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) throw new Error('Credenciales inválidas');
    const isMatch = await bcrypt.compare(data.password, user.password || '');
    if (!isMatch) throw new Error('Credenciales inválidas');

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async loginWithGoogle(googleToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Token de Google inválido');

    const { email, given_name, family_name, sub: googleId } = payload;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          nombre: given_name || 'Usuario',
          apellido: family_name || '',
          googleId: googleId,
          role: 'USER',
        }
      });

      await prisma.cliente.create({ data: { userId: user.id } });
    } else {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId }
        });
      }
    }

    const token = this.tokenService.generate({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}