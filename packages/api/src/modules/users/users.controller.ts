import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

export const getAll = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, apellido: true, email: true, role: true, createdAt: true }, // No devolvemos password
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo usuarios' });
  }
};