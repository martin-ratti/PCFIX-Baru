
import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../services/JwtTokenService';
import { prisma } from '../database/prismaClient';

const tokenService = new JwtTokenService();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token no proporcionado o formato inválido' });
    }

    const token = authHeader.split(' ')[1];

    const decoded: any = tokenService.verify(token);

    const userExists = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!userExists) {
      return res.status(401).json({ success: false, error: 'El usuario ya no existe o fue deshabilitado' });
    }

    (req as AuthRequest).user = userExists as any;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Sesión expirada o inválida' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: Requiere permisos de Administrador' });
  }
  next();
};