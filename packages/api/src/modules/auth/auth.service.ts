import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database/prismaClient';
import { JwtTokenService } from '../../shared/services/JwtTokenService';
// 1. IMPORTAR LA LIBRERÍA DE GOOGLE
import { OAuth2Client } from 'google-auth-library';

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
  // 2. CLIENTE DE GOOGLE
  private googleClient: OAuth2Client;

  constructor() {
    this.tokenService = new JwtTokenService();
    // Necesitas definir GOOGLE_CLIENT_ID en tu .env
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
    
    // Crear perfil de cliente automáticamente
    await prisma.cliente.create({ data: { userId: newUser.id } });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) throw new Error('Credenciales inválidas');

    if (!user.password) {
      throw new Error('Esta cuenta usa inicio de sesión social (Google). Por favor inicia sesión con ese método.');
    }

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

  // 3. NUEVO MÉTODO: LOGIN CON GOOGLE
  async loginWithGoogle(googleToken: string) {
    // A. Verificar el token con Google (Seguridad Crítica)
    const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Token de Google inválido');

    const { email, given_name, family_name, sub: googleId } = payload;

    // B. Buscar si el usuario ya existe
    let user = await prisma.user.findUnique({ where: { email } });

    // C. Si no existe, lo creamos (Registro automático)
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                nombre: given_name || 'Usuario',
                apellido: family_name || '',
                googleId: googleId,
                role: 'USER', // Por defecto
                // No guardamos password porque entra por social
            }
        });
        
        // Crear perfil de cliente automáticamente
        await prisma.cliente.create({ data: { userId: user.id } });
    } else {
        // Si existe pero no tenía googleId (ej: se registró por form antes), lo vinculamos
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId }
            });
        }
    }

    // D. Generar NUESTRO token JWT (Igual que en login normal)
    const token = this.tokenService.generate({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    // Devolvemos el usuario y nuestro token (no el de Google)
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}