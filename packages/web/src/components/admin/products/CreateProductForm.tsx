import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';

// 1. ACTUALIZACIÓN DEL SCHEMA (Validación)
const productSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
  precio: z.coerce.number().positive('Precio inválido'),
  stock: z.coerce.number().int().nonnegative('Stock inválido'),
  categoriaId: z.coerce.number().int().positive('Selecciona una categoría'),
  marcaId: z.coerce.number().int().optional(),
  fotoFile: z.any().optional(),
  // Nuevos campos logísticos
  peso: z.coerce.number().positive('Peso requerido'),
  alto: z.coerce.number().int().positive('Alto requerido'),
  ancho: z.coerce.number().int().positive('Ancho requerido'),
  profundidad: z.coerce.number().int().positive('Profundidad requerida'),
});

type ProductSchema = z.infer<typeof productSchema>;
interface Category { id: number; nombre: string; }
interface Brand { id: number; nombre: string; }

export default function CreateProductForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const addToast = useToastStore(s => s.addToast);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/categories').then(res => res.json()).then(data => data.success && setCategories(data.data));
    fetch('http://localhost:3002/api/brands').then(res => res.json()).then(data => data.success && setBrands(data.data));
  }, []);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: 1,
      // Valores por defecto lógicos para no frustrar al usuario
      peso: 0.5,
      alto: 10,
      ancho: 10,
      profundidad: 5
    }
  });

  const fileWatch = watch('fotoFile');
  useEffect(() => {
    if (fileWatch && fileWatch.length > 0) setFileName(fileWatch[0].name);
    else setFileName(null);
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

      // 2. AGREGAR CAMPOS LOGÍSTICOS AL FORMDATA
      formData.append('peso', data.peso.toString());
      formData.append('alto', data.alto.toString());
      formData.append('ancho', data.ancho.toString());
      formData.append('profundidad', data.profundidad.toString());

      if (data.marcaId) formData.append('marcaId', data.marcaId.toString());
      if (data.fotoFile && data.fotoFile[0]) formData.append('foto', data.fotoFile[0]);

      const response = await fetch('http://localhost:3002/api/products', { method: 'POST', body: formData });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);
      addToast('Producto creado exitosamente', 'success');
      reset();
      setFileName(null);
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

        {/* Columna Izquierda: Datos Básicos */}
        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input id="nombre" data-testid="input-nombre" {...register('nombre')} className="w-full mt-1 p-2 border rounded-md" placeholder="Ej: Ryzen 5 5600X" />
            {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700">Precio ($)</label>
              <input id="precio" data-testid="input-precio" type="number" step="0.01" {...register('precio')} className="w-full mt-1 p-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
              <input id="stock" data-testid="input-stock" type="number" {...register('stock')} className="w-full mt-1 p-2 border rounded-md" />
            </div>
          </div>

          {/* 3. SECCIÓN LOGÍSTICA (NUEVO) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
              📦 Dimensiones y Peso
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="peso" className="block text-xs font-medium text-gray-600">Peso (kg)</label>
                <input id="peso" data-testid="input-peso" type="number" step="0.001" {...register('peso')} className="w-full mt-1 p-2 border rounded-md text-sm" />
              </div>
              <div className="col-span-1 grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="alto" className="block text-xs font-medium text-gray-600">Alto</label>
                  <input id="alto" data-testid="input-alto" type="number" {...register('alto')} className="w-full mt-1 p-2 border rounded-md text-sm" placeholder="cm" />
                </div>
                <div>
                  <label htmlFor="ancho" className="block text-xs font-medium text-gray-600">Ancho</label>
                  <input id="ancho" data-testid="input-ancho" type="number" {...register('ancho')} className="w-full mt-1 p-2 border rounded-md text-sm" placeholder="cm" />
                </div>
                <div>
                  <label htmlFor="profundidad" className="block text-xs font-medium text-gray-600">Prof.</label>
                  <input id="profundidad" data-testid="input-prof" type="number" {...register('profundidad')} className="w-full mt-1 p-2 border rounded-md text-sm" placeholder="cm" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Clasificación e Imagen */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700">Categoría</label>
              <select id="categoriaId" data-testid="select-category" {...register('categoriaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="marcaId" className="block text-sm font-medium text-gray-700">Marca</label>
              <select id="marcaId" data-testid="select-brand" {...register('marcaId')} className="w-full mt-1 p-2 border rounded-md bg-white">
                <option value="">Sin Marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
            <div className="mt-1">
              <input type="file" id="product-image-upload" accept="image/*" {...register('fotoFile')} className="hidden" />
              <label htmlFor="product-image-upload" className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2 flex-col">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="truncate max-w-xs">{fileName || "Haz clic para subir imagen"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea id="descripcion" data-testid="input-description" {...register('descripcion')} rows={4} className="w-full mt-1 p-2 border rounded-md" placeholder="Detalles técnicos del producto..."></textarea>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={isLoading} className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-md active:scale-95">
            {isLoading ? 'Subiendo...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}