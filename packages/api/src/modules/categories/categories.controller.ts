import { Request, Response } from 'express';
import { CategoryService } from './categories.service';

const categoryService = new CategoryService();

// 1. Obtener todas
export const getAll = async (req: Request, res: Response) => {
  try {
    const flat = req.query.flat === 'true';
    const categories = await categoryService.findAll(flat);
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 👇 2. Obtener por ID (ESTE ES EL QUE FALTABA O FALLABA)
export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const category = await categoryService.findById(id);
    
    if (!category) {
        return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    }
    
    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Crear
export const create = async (req: Request, res: Response) => {
  try {
    const { nombre, padreId } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });
    
    const newCat = await categoryService.create({ nombre, padreId: padreId ? Number(padreId) : null });
    res.status(201).json({ success: true, data: newCat });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Eliminar
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await categoryService.delete(id);
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};