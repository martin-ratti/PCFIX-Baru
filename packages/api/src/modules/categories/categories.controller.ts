import { Request, Response } from 'express';
import { CategoryService } from './categories.service';

const categoryService = new CategoryService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const flat = req.query.flat === 'true';
    // 👇 CORRECCIÓN: Un solo argumento
    const categories = await categoryService.findAll(flat);
    res.json({ success: true, data: categories });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nombre, padreId } = req.body;
    if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });
    
    // 👇 CORRECCIÓN: Pasamos un objeto
    const newCat = await categoryService.create({ nombre, padreId: padreId ? Number(padreId) : null });
    res.status(201).json({ success: true, data: newCat });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const getById = async (req: Request, res: Response) => { try { const cat = await categoryService.findById(Number(req.params.id)); if (!cat) return res.status(404).json({error:'Not found'}); res.json({success:true, data: cat}); } catch (e:any) { res.status(500).json({error: e.message}); } };
export const remove = async (req: Request, res: Response) => { try { await categoryService.delete(Number(req.params.id)); res.json({success:true}); } catch (e:any) { res.status(400).json({error: e.message}); } };