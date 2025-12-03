import { Request, Response } from 'express';
import { UserService } from './users.service';
import { z } from 'zod';

const userService = new UserService();

const profileSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  apellido: z.string().min(2, "El apellido es muy corto"),
});

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id); 
        if (isNaN(userId)) return res.status(400).json({ success: false, error: 'ID inválido' });

        const user = await userService.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener perfil' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id);
        if (isNaN(userId)) return res.status(400).json({ success: false, error: 'ID inválido' });

        const validatedData = profileSchema.parse(req.body);
        
        const updatedUser = await userService.update(userId, validatedData);
        res.json({ success: true, data: updatedUser, message: 'Perfil actualizado correctamente' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ success: false, error: error.message || 'Error al actualizar' });
    }
};