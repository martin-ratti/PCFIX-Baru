import { Request, Response } from 'express';
import { ProductService } from './products.service';
import { createProductSchema } from './products.schema';
import { z } from 'zod';

const productService = new ProductService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const products = await productService.findAll();
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
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    // 1. Obtener la URL de la imagen
    let fotoUrl = 'https://placehold.co/600x600/png?text=Sin+Foto'; // Por defecto

    if (req.file) {
      // Construimos la URL completa para acceder a la imagen subida
      const protocol = req.protocol;
      const host = req.get('host');
      fotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      // Soporte legacy por si mandan URL directa
      fotoUrl = req.body.fotoUrl;
    }

    // 2. Preparar datos para el schema (Multer envía todo como strings)
    // Necesitamos convertir los números manualmente antes de validar con Zod.
    const rawData = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      precio: Number(req.body.precio),
      stock: Number(req.body.stock),
      categoriaId: Number(req.body.categoriaId),
      foto: fotoUrl // Usamos la URL generada
    };

    // 3. Validar con Zod
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