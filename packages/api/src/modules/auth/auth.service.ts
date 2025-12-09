import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../shared/database/prismaClient';
import { EmailService } from '../../shared/services/EmailService';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const emailService = new EmailService();

export class AuthService {

  async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Create Cliente profile
    await prisma.cliente.create({ data: { userId: user.id } });

    const token = this.generateToken(user);

    // Send Welcome Email
    await emailService.sendWelcomeEmail(user.email, user.nombre);

    return { user, token };
  }

  async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.password) {
      throw new Error('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async loginWithGoogle(idToken: string) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new Error('Token de Google inválido');
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          nombre: payload.given_name || 'Usuario',
          apellido: payload.family_name || '',
          password: '',
          googleId: payload.sub,
          role: 'USER',
        },
      });

      await prisma.cliente.create({ data: { userId: user.id } });

      // Send Welcome Email for Google Sign Up too
      await emailService.sendWelcomeEmail(user.email, user.nombre);
    } else if (!user.googleId) {
      // Link Google ID if expecting it
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal user existence, but technically we return success
      return { message: 'Si el correo existe, se envió el enlace.' };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    await emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Correo enviado' };
  }

  async resetPassword(token: string, newOnlyPass: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newOnlyPass, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Contraseña actualizada' };
  }

  async deleteAccount(userId: number) {
    // 1. Check for active orders
    const activeOrdersCount = await prisma.venta.count({
      where: {
        cliente: { userId },
        estado: {
          in: ['PENDIENTE_PAGO', 'PENDIENTE_APROBACION', 'APROBADO', 'ENVIADO']
        }
      }
    });

    if (activeOrdersCount > 0) {
      throw new Error('No puedes eliminar tu cuenta porque tienes pedidos en curso.');
    }

    // 2. Delete dependencies if necessary (Cascade usually handles this, but let's be safe/explicit if needed)
    // For now, relying on Prisma Cascade or simple delete if schema allows. 
    // If Client is unique to User and onDelete: Cascade is set, deleting User deletes Client.
    // Let's assume Prisma schema handles cascade for now, or we delete user which is the root.

    await prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Cuenta eliminada correctamente' };
  }

  private generateToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

export const authService = new AuthService();