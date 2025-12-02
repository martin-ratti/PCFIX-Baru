import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(10),
  precio: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  categoriaId: z.coerce.number().int().positive('Selecciona una categoría'),
  marcaId: z.coerce.number().int().optional(), // Nuevo campo opcional
  fotoFile: z.any().optional(),
});

type ProductSchema = z.infer<typeof productSchema>;

interface Category { id: number; nombre: string; }
interface Brand { id: number; nombre: string; }

export default function CreateProductForm() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('http://localhost:3002/api/categories').then(res => res.json()).then(data => data.success && setCategories(data.data));
    fetch('http://localhost:3002/api/brands').then(res => res.json()).then(data => data.success && setBrands(data.data));
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 1 }
  });

  const onSubmit = async (data: ProductSchema) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('descripcion', data.descripcion);
      formData.append('precio', data.precio.toString());
      formData.append('stock', data.stock.toString());
      formData.append('categoriaId', data.categoriaId.toString());
      if (data.marcaId) formData.append('marcaId', data.marcaId.toString());
      
      if (data.fotoFile && data.fotoFile[0]) {
        formData.append('foto', data.fotoFile[0]);
      }

      const response = await fetch('http://localhost:3002/api/products', {
        method: 'POST',
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
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message as string}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" step="0.01" {...register('precio')} className="w-full mt-1 p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" {...register('stock')} className="w-full mt-1 p-2 border rounded-md" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select {...register('categoriaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
                {errors.categoriaId && <span className="text-red-500 text-xs block">{errors.categoriaId.message as string}</span>}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <select {...register('marcaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Sin Marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <input type="file" accept="image/*" {...register('fotoFile')} className="w-full mt-1 p-2 border rounded-md text-sm" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea {...register('descripcion')} rows={4} className="w-full mt-1 p-2 border rounded-md"></textarea>
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