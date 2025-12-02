import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Esquema actualizado: 'foto' es opcional (url), agregamos 'fotoFile' (archivo)
const productSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
  precio: z.coerce.number().positive('Precio inválido'),
  stock: z.coerce.number().int().nonnegative('Stock inválido'),
  categoriaId: z.coerce.number().int().positive('Selecciona una categoría'),
  foto: z.string().optional(), // URL opcional legacy
  // Validación especial para el archivo en el cliente
  fotoFile: z.any()
    .refine((files) => files?.length > 0, "La imagen es obligatoria")
    .refine((files) => files?.[0]?.size <= 5000000, `Tamaño máximo 5MB`)
    .refine(
      (files) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(files?.[0]?.type),
      "Solo formatos .jpg, .png, .webp"
    )
});

type ProductSchema = z.infer<typeof productSchema>;

interface Category { id: number; nombre: string; }

export default function CreateProductForm() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('http://localhost:3002/api/categories')
      .then(res => res.json())
      .then(data => data.success && setCategories(data.data))
      .catch(err => console.error(err));
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 1 }
  });

  const onSubmit = async (data: ProductSchema) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // --- CLAVE: Usar FormData para enviar archivos ---
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('descripcion', data.descripcion);
      formData.append('precio', data.precio.toString());
      formData.append('stock', data.stock.toString());
      formData.append('categoriaId', data.categoriaId.toString());
      
      // Adjuntar el archivo si existe
      if (data.fotoFile && data.fotoFile[0]) {
        formData.append('foto', data.fotoFile[0]);
      }

      // NOTA: Al usar FormData, NO se pone Content-Type: application/json header.
      // El navegador lo pone automáticamente como multipart/form-data.
      const response = await fetch('http://localhost:3002/api/products', {
        method: 'POST',
        // headers: { 'Authorization': `Bearer ${token}` }, // Pendiente auth
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setMessage({ type: 'success', text: '¡Producto creado exitosamente!' });
      reset();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al crear producto' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-secondary border-b pb-2">Nuevo Producto</h2>

      {message && (
        <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna Izquierda */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message as string}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" step="0.01" {...register('precio')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.precio && <span className="text-red-500 text-xs">{errors.precio.message as string}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" {...register('stock')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.stock && <span className="text-red-500 text-xs">{errors.stock.message as string}</span>}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select {...register('categoriaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
              <option value="">Seleccionar...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>
            {errors.categoriaId && <span className="text-red-500 text-xs block">{errors.categoriaId.message as string}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
            {/* CAMBIO: Input type="file" */}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp"
              {...register('fotoFile')} 
              className="w-full mt-1 p-2 border rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90" 
            />
            {errors.fotoFile && <span className="text-red-500 text-xs">{errors.fotoFile.message as string}</span>}
            <p className="text-xs text-gray-500 mt-1">JPG, PNG o WebP. Máx 5MB.</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea {...register('descripcion')} rows={4} className="w-full mt-1 p-2 border rounded-md"></textarea>
          {errors.descripcion && <span className="text-red-500 text-xs">{errors.descripcion.message as string}</span>}
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded-md font-bold disabled:opacity-50">
            {isLoading ? 'Subiendo...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}