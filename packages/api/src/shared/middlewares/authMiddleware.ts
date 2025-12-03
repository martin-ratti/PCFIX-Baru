import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../services/JwtTokenService';

const tokenService = new JwtTokenService();

// Extendemos la interfaz de Request para incluir el usuario
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No se proporcionó token de autenticación' });
    }

    // El formato estándar es "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Formato de token inválido' });
    }

    // Verificar y decodificar
    const decoded = tokenService.verify(token);
    
    // Inyectamos el usuario seguro en la request
    (req as AuthRequest).user = decoded as any;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
};

// Middleware para asegurar que sea Admin (opcional para uso futuro)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: Se requieren permisos de administrador' });
  }
  next();
};