import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { createProductSchema } from './products.schema';
import { z } from 'zod';

const productService = new ProductService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    
    const products = await productService.findAll(categoryId);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error(error);
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
      precio: Number(req.body.precio),
      stock: Number(req.body.stock),
      categoriaId: Number(req.body.categoriaId),
      foto: fotoUrl
    };

    const data = createProductSchema.parse(rawData);
    const newProduct = await productService.create(data);
    
    res.status(201).json({ 
      success: true, 
      data: newProduct,
      message: 'Producto creado correctamente' 
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, error: error.message || 'No se pudo crear el producto' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

    // Llamamos al Soft Delete
    await productService.delete(id);
    
    res.json({ success: true, message: 'Producto eliminado correctamente (Soft Delete)' });
  } catch (error) {
    console.error(error);
    // Si falla es probable que el ID no exista o la DB esté caída
    res.status(500).json({ success: false, error: 'No se pudo eliminar el producto' });
  }
};