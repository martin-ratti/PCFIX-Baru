import { Request, Response } from 'express';
import { prisma } from '../../shared/database/prismaClient';

export const subscribeToStockAlert = async (req: Request, res: Response) => {
    try {
        const { email, productId } = req.body;

        if (!email || !productId) {
            return res.status(400).json({ success: false, message: 'Email y producto son requeridos' });
        }

        
        const existingAlert = await (prisma as any).stockAlert.findUnique({
            where: {
                email_productoId: {
                    email,
                    productoId: Number(productId)
                }
            }
        });

        if (existingAlert) {
            return res.json({ success: true, message: 'Ya estás suscrito a esta alerta' });
        }

        await (prisma as any).stockAlert.create({
            data: {
                email,
                productoId: Number(productId)
            }
        });

        res.json({ success: true, message: '¡Te avisaremos cuando haya stock!' });
    } catch (error) {
        console.error('Error suscribiendo a alerta:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};
