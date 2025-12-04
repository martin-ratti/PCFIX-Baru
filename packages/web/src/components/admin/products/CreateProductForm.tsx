import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';

// ... (Schemas e interfaces igual que antes) ...
const productSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
  precio: z.coerce.number().positive('Precio inválido'),
  stock: z.coerce.number().int().nonnegative('Stock inválido'),
  categoriaId: z.coerce.number().int().positive('Selecciona una categoría'),
  marcaId: z.coerce.number().int().optional(),
  fotoFile: z.any().optional(),
});
type ProductSchema = z.infer<typeof productSchema>;
interface Category { id: number; nombre: string; }
interface Brand { id: number; nombre: string; }

export default function CreateProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const addToast = useToastStore(s => s.addToast);

  // NUEVO: Para mostrar el nombre del archivo seleccionado
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/categories').then(res => res.json()).then(data => data.success && setCategories(data.data));
    fetch('http://localhost:3002/api/brands').then(res => res.json()).then(data => data.success && setBrands(data.data));
  }, []);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: { stock: 1 }
  });

  // Observamos el input para actualizar el nombre del archivo
  const fileWatch = watch('fotoFile');
  useEffect(() => {
    if (fileWatch && fileWatch.length > 0) {
        setFileName(fileWatch[0].name);
    } else {
        setFileName(null);
    }
  }, [fileWatch]);

  const onSubmit = async (data: ProductSchema) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('descripcion', data.descripcion);
      formData.append('precio', data.precio.toString());
      formData.append('stock', data.stock.toString());
      formData.append('categoriaId', data.categoriaId.toString());
      if (data.marcaId) formData.append('marcaId', data.marcaId.toString());
      if (data.fotoFile && data.fotoFile[0]) formData.append('foto', data.fotoFile[0]);

      const response = await fetch('http://localhost:3002/api/products', { method: 'POST', body: formData });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      addToast('Producto creado exitosamente', 'success');
      reset();
      setFileName(null); // Reset nombre archivo
    } catch (error: any) {
      addToast(error.message || 'Error al crear', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-secondary border-b pb-2">Nuevo Producto</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... Campos de texto iguales ... */}
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
          {/* ... Selects iguales ... */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select {...register('categoriaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <select {...register('marcaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Sin Marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
             </div>
          </div>

          {/* ▼▼▼ INPUT DE ARCHIVO REDONDEADO ▼▼▼ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
            <div className="mt-1">
                {/* 1. Input oculto */}
                <input 
                    type="file" 
                    id="product-image-upload" 
                    accept="image/*" 
                    {...register('fotoFile')} 
                    className="hidden" 
                />
                {/* 2. Label estilizada como botón redondo */}
                <label 
                    htmlFor="product-image-upload" 
                    className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="truncate">{fileName || "Seleccionar imagen..."}</span>
                </label>
            </div>
          </div>
          {/* ▲▲▲ FIN INPUT REDONDEADO ▲▲▲ */}

        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea {...register('descripcion')} rows={4} className="w-full mt-1 p-2 border rounded-md"></textarea>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded-md font-bold">
            {isLoading ? 'Subiendo...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}