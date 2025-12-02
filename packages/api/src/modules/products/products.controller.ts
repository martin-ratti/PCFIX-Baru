import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { createProductSchema } from './products.schema';
import { z } from 'zod';

const productService = new ProductService();

const parseNumber = (val: any): number | undefined | null => {
  if (val === undefined || val === 'undefined') return undefined;
  if (val === null || val === 'null' || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

const parseBoolean = (val: any): boolean | undefined => {
  if (val === undefined || val === 'undefined') return undefined;
  return val === 'true' || val === true;
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const marcaId = req.query.marcaId ? Number(req.query.marcaId) : undefined;
    const lowStock = req.query.lowStock === 'true';
    const search = req.query.search ? String(req.query.search) : undefined;
    const products = await productService.findAll(categoryId, marcaId, lowStock, search);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const product = await productService.findById(id);
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    let fotoUrl = 'https://placehold.co/600x600/png?text=Sin+Foto';

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      fotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      fotoUrl = req.body.fotoUrl;
    }

    const rawData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      precio: parseNumber(req.body.precio),
      precioOriginal: parseNumber(req.body.precioOriginal),
      stock: parseNumber(req.body.stock),
      categoriaId: parseNumber(req.body.categoriaId),
      marcaId: parseNumber(req.body.marcaId), // Nuevo
      isFeatured: parseBoolean(req.body.isFeatured),
      foto: fotoUrl
    };

    const data = createProductSchema.parse(rawData);
    const newProduct = await productService.create(data);
    res.status(201).json({ success: true, data: newProduct });

  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    let fotoUrl = undefined;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      fotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      fotoUrl = req.body.fotoUrl;
    }

    const updateSchema = createProductSchema.partial();
    
    const rawData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      precio: parseNumber(req.body.precio),
      precioOriginal: parseNumber(req.body.precioOriginal),
      stock: parseNumber(req.body.stock),
      categoriaId: parseNumber(req.body.categoriaId),
      marcaId: parseNumber(req.body.marcaId), // Nuevo
      isFeatured: parseBoolean(req.body.isFeatured),
      foto: fotoUrl
    };

    const cleanData = Object.fromEntries(Object.entries(rawData).filter(([_, v]) => v !== undefined));
    const data = updateSchema.parse(cleanData);
    
    const updatedProduct = await productService.update(id, data);
    res.json({ success: true, data: updatedProduct });

  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
    await productService.delete(id);
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'No se pudo eliminar el producto' });
  }
};