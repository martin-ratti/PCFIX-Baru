import { Request, Response } from 'express';
import { TechnicalService } from './technical.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';

const service = new TechnicalService();

// --- CONSULTAS ---

export const createInquiry = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { asunto, mensaje } = req.body;
        
        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        
        const inquiry = await service.createInquiry(userId, asunto, mensaje);
        res.status(201).json({ success: true, data: inquiry });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
};

export const getAllInquiries = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const result = await service.findAllInquiries(page, 20);
        res.json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getMyInquiries = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        
        const results = await service.findInquiriesByUserId(userId);
        res.json({ success: true, data: results });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const replyInquiry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { respuesta } = req.body;
        const updated = await service.replyInquiry(Number(id), respuesta);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// --- PRECIOS (NUEVO) ---

export const getPrices = async (req: Request, res: Response) => {
    try {
        const items = await service.getServicePrices();
        res.json({ success: true, data: items });
    } catch (e: any) {
        res.status(500).json({ success: false, error: 'Error al obtener precios' });
    }
};

export const updatePrice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (price === undefined || isNaN(price)) {
            return res.status(400).json({ success: false, error: 'Precio inválido' });
        }

        const updated = await service.updateServicePrice(Number(id), Number(price));
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: 'Error al actualizar servicio' });
    }
};