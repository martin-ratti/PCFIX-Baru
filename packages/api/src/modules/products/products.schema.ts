import { z } from 'zod';

export const createProductSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe ser más detallada'),
  precio: z.number().positive('El precio debe ser positivo'),
  precioOriginal: z.number().positive().optional().nullable(),   
  stock: z.number().int().nonnegative('El stock no puede ser negativo'),
  categoriaId: z.number().int('ID de categoría inválido'),
  foto: z.string().url('La foto debe ser una URL válida').optional(),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;