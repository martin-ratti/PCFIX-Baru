import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { createProductSchema } from './products.schema';
import { z } from 'zod';

const productService = new ProductService();

// Helpers de parsing
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
    const marcaId = req.query.brandId ? Number(req.query.brandId) : undefined; // OJO: brandId o marcaId según frontend
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    
    // LÓGICA DE FILTRO UNIFICADO
    // El frontend puede enviar ?filter=lowStock o ?filter=featured o ?filter=hasDiscount
    // O pasamos parámetros booleanos y construimos el string 'filter' aquí.
    let filterString = req.query.filter ? String(req.query.filter) : undefined;

    if (!filterString) {
        if (req.query.lowStock === 'true') filterString = 'lowStock';
        else if (req.query.isFeatured === 'true') filterString = 'featured';
        else if (req.query.hasDiscount === 'true') filterString = 'hasDiscount';
    }
    
    // Llamada corregida con 6 argumentos:
    // findAll(page, limit, categoryId, brandId, search, filterString)
    const result = await productService.findAll(page, limit, categoryId, marcaId, search, filterString);
    
    res.json({ success: true, ...result }); // Spread para data y meta
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error al obtener productos' });
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
    } else if (req.body.fotoUrl) { fotoUrl = req.body.fotoUrl; }

    const rawData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      precio: parseNumber(req.body.precio),
      precioOriginal: parseNumber(req.body.precioOriginal),
      stock: parseNumber(req.body.stock),
      
      peso: parseNumber(req.body.peso) || 0.5,
      alto: parseNumber(req.body.alto) || 10,
      ancho: parseNumber(req.body.ancho) || 10,
      profundidad: parseNumber(req.body.profundidad) || 10,

      categoriaId: parseNumber(req.body.categoriaId),
      marcaId: parseNumber(req.body.marcaId), 
      isFeatured: parseBoolean(req.body.isFeatured),
      foto: fotoUrl
    };

    const data = createProductSchema.parse(rawData);
    const newProduct = await productService.create(data as any);
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
    } else if (req.body.fotoUrl) { fotoUrl = req.body.fotoUrl; }

    const updateSchema = createProductSchema.partial();
    
    const rawData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      precio: parseNumber(req.body.precio),
      precioOriginal: parseNumber(req.body.precioOriginal),
      stock: parseNumber(req.body.stock),
      
      peso: parseNumber(req.body.peso),
      alto: parseNumber(req.body.alto),
      ancho: parseNumber(req.body.ancho),
      profundidad: parseNumber(req.body.profundidad),

      categoriaId: parseNumber(req.body.categoriaId),
      marcaId: parseNumber(req.body.marcaId), 
      isFeatured: parseBoolean(req.body.isFeatured),
      foto: fotoUrl
    };

    // Eliminamos undefined
    const cleanData = Object.fromEntries(Object.entries(rawData).filter(([_, v]) => v !== undefined));
    const data = updateSchema.parse(cleanData);
    
    const updatedProduct = await productService.update(id, data as any);
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