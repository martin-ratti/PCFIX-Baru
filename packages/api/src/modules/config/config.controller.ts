import { Request, Response } from 'express';
import { ConfigService } from './config.service';

const service = new ConfigService();

export const get = async (req: Request, res: Response) => {
  try {
    const config = await service.getConfig();
    res.json({ success: true, data: config });
  } catch (e) { res.status(500).json({ success: false, error: 'Error al obtener configuración' }); }
};

export const update = async (req: Request, res: Response) => {
  try {
    // Aquí deberías validar que sea ADMIN (middleware)
    const updated = await service.updateConfig(req.body);
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: 'Error al actualizar' }); }
};