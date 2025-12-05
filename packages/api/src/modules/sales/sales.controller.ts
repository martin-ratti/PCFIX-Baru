import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { VentaEstado } from '@prisma/client';

const service = new SalesService();

export const createSale = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { items, subtotal, cpDestino, tipoEntrega, medioPago } = req.body;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const sale = await service.createSale(userId, items, subtotal, cpDestino, tipoEntrega, medioPago);
        res.status(201).json({ success: true, data: sale });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const uploadReceipt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Archivo opcional (para efectivo)
        let receiptUrl = undefined;
        if (req.file) {
            receiptUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const updated = await service.uploadReceipt(Number(id), receiptUrl);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { medioPago } = req.body;
        const updated = await service.updatePaymentMethod(Number(id), medioPago);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await service.cancelOrder(Number(id));
        res.json({ success: true, data: result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getMySales = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const sales = await service.findByUserId(userId);
        res.json({ success: true, data: sales });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        const sale = await service.findById(Number(req.params.id));
        if (!sale) return res.status(404).json({ success: false, error: 'Not Found' });
        res.json({ success: true, data: sale });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

// --- ADMIN ---

export const getAllSales = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const month = req.query.month ? Number(req.query.month) : undefined;
        const year = req.query.year ? Number(req.query.year) : undefined;
        const result = await service.findAll(page, 20, month, year);
        res.json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await service.updateStatus(Number(id), status);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const dispatchSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { trackingCode } = req.body;
        if (!trackingCode) return res.status(400).json({ success: false, error: 'Code required' });
        const updated = await service.dispatchSale(Number(id), trackingCode);
        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    try {
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const data = await service.getMonthlyBalance(year);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
};