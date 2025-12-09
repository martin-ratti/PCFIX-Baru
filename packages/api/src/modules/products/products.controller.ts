import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { createProductSchema } from './products.schema';
import { z } from 'zod';

const productService = new ProductService();
const parseNumber = (val: any) => { if (!val) return undefined; const n = Number(val); return isNaN(n) ? undefined : n; };

export const getAll = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const brandParam = req.query.brandId || req.query.marcaId;
    const brandId = brandParam ? Number(brandParam) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    let filter = req.query.filter ? String(req.query.filter) : undefined;
    const sort = req.query.order ? String(req.query.order) : 'newest';
    const selectMinimal = req.query.minimal === 'true';

    const result = await productService.findAll(page, limit, categoryId, brandId, search, filter, sort, selectMinimal);

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};
export const getForPOS = async (req: Request, res: Response) => { try { const search = req.query.search ? String(req.query.search) : undefined; const limit = req.query.limit ? Number(req.query.limit) : 20; const products = await productService.findAllPOS(search, limit); res.json({ success: true, data: products }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); } };
export const getById = async (req: Request, res: Response) => { try { const id = Number(req.params.id); if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' }); const product = await productService.findById(id); if (!product) return res.status(404).json({ success: false, error: 'No encontrado' }); res.json({ success: true, data: product }); } catch (error) { res.status(500).json({ success: false, error: 'Error' }); } };
export const create = async (req: Request, res: Response) => {
  try {
    let foto = undefined;
    if (req.file) foto = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const data = createProductSchema.parse({
      ...req.body,
      precio: parseNumber(req.body.precio),
      stock: parseNumber(req.body.stock),
      categoriaId: parseNumber(req.body.categoriaId),
      peso: parseNumber(req.body.peso),
      alto: parseNumber(req.body.alto),
      ancho: parseNumber(req.body.ancho),
      profundidad: parseNumber(req.body.profundidad),
      foto
    });
    const newP = await productService.create(data);
    res.status(201).json({ success: true, data: newP });
  } catch (error: any) {
    console.error('❌ Error creando producto:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let foto = undefined;
    if (req.file) foto = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const data = createProductSchema.partial().parse({
      ...req.body,
      precio: parseNumber(req.body.precio),
      stock: parseNumber(req.body.stock),
      categoriaId: parseNumber(req.body.categoriaId),
      peso: parseNumber(req.body.peso),
      alto: parseNumber(req.body.alto),
      ancho: parseNumber(req.body.ancho),
      profundidad: parseNumber(req.body.profundidad),
      foto
    });
    const upP = await productService.update(id, data);
    res.json({ success: true, data: upP });
  } catch (error: any) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const remove = async (req: Request, res: Response) => { try { await productService.delete(Number(req.params.id)); res.json({ success: true }); } catch (error: any) { res.status(500).json({ success: false, error: error.message }); } };