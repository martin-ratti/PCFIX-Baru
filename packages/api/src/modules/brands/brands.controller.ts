import { Request, Response } from 'express';
import { BrandService } from './brands.service';

const brandService = new BrandService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const brands = await brandService.findAll();
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo marcas' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });

    let logoUrl = undefined;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      logoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const newBrand = await brandService.create(nombre, logoUrl);
    res.status(201).json({ success: true, data: newBrand });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await brandService.delete(id);
    res.json({ success: true, message: 'Marca eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'No se pudo eliminar (¿Tiene productos?)' });
  }
};