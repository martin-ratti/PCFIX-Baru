import { Request, Response } from 'express';
import { BannerService } from './banners.service';

const bannerService = new BannerService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const banners = await bannerService.findAll();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener banners' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Imagen requerida' });
    const marcaId = Number(req.body.marcaId);
    if (isNaN(marcaId) || marcaId === 0) return res.status(400).json({ success: false, error: 'Selecciona una marca válida' });

    const protocol = req.protocol;
    const host = req.get('host');
    const imagenUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const newBanner = await bannerService.create(marcaId, imagenUrl);
    res.status(201).json({ success: true, data: newBanner });
  } catch (error: any) {
    // Borrar la imagen subida si falla la creación en BD (opcional, buena práctica)
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await bannerService.delete(id);
    res.json({ success: true, message: 'Banner eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar banner' });
  }
};