import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';

const service = new SalesService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await service.findAll(page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo ventas' });
  }
};

// Crear Venta (Protegido)
export const create = async (req: Request, res: Response) => {
    try {
        // SEGURIDAD: ID del token
        const userId = (req as AuthRequest).user?.id;
        const { items, total, cpDestino } = req.body; 

        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

        const sale = await service.createSale(userId, items, total, cpDestino);
        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
        console.error(e);
        res.status(400).json({ success: false, error: e.message });
    }
};

// Mis Compras (Protegido)
export const getMySales = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

        const sales = await service.findByUserId(userId);
        res.json({ success: true, data: sales });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Error al obtener mis compras' });
    }
};

export const getById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const sale = await service.findById(id);
        if(!sale) return res.status(404).json({success: false, error: "Venta no encontrada"});
        res.json({ success: true, data: sale });
    } catch (e) { res.status(500).json({ success: false, error: "Error" }); }
};

export const uploadReceipt = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Falta el archivo' });
        const id = Number(req.params.id);
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}/uploads/${req.file.filename}`;
        
        const updated = await service.uploadReceipt(id, url);
        res.json({ success: true, data: updated });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;
        const updated = await service.updateStatus(id, estado);
        res.json({ success: true, data: updated });
    } catch (e) { res.status(500).json({ success: false, error: "Error" }); }
};

// Nuevo: Despachar
export const dispatch = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { trackingCode } = req.body;
        if (!trackingCode) return res.status(400).json({ success: false, error: "Falta código de seguimiento" });

        const updated = await service.dispatchSale(id, trackingCode);
        res.json({ success: true, data: updated });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
};