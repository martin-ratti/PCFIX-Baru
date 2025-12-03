import { Request, Response } from 'express';
import { CategoryService } from './categories.service';

const categoryService = new CategoryService();

export const getAll = async (req: Request, res: Response) => {
  try {
    // Si piden ?flat=true devolvemos lista plana, sino jerárquica
    const flat = req.query.flat === 'true';
    const categories = flat ? await categoryService.findAllFlat() : await categoryService.findAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo categorías' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nombre, padreId } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });
    
    const newCat = await categoryService.create(nombre, padreId ? Number(padreId) : undefined);
    res.status(201).json({ success: true, data: newCat });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await categoryService.delete(Number(req.params.id));
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'No se pudo eliminar (¿Tiene productos o subcategorías?)' });
  }
};