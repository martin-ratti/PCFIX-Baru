import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient'; 
import { z } from 'zod'; 

// Esquema mínimo para la actualización de perfil
const profileSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido: z.string().min(2, 'Apellido requerido'),
});

// Campos de usuario que son seguros para devolver al frontend
const userSelectFields = { 
    id: true, 
    nombre: true, 
    apellido: true, 
    email: true, 
    role: true, 
    createdAt: true 
};

// Obtener perfil por ID
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id); 
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: userSelectFields
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener perfil' });
    }
};

// Actualizar perfil
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id);
        
        // 1. Validación
        const validatedData = profileSchema.parse(req.body);

        // 2. Actualización en DB
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                nombre: validatedData.nombre,
                apellido: validatedData.apellido,
            },
            select: userSelectFields
        });

        res.json({ success: true, data: updatedUser, message: 'Perfil actualizado' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ success: false, error: error.message || 'Error al actualizar perfil' });
    }
};

// (Mantenemos la función getAll para el dashboard)
export const getAll = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelectFields,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
};