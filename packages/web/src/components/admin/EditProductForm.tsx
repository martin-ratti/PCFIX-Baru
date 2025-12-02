import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { navigate } from 'astro:transitions/client';
import { useToastStore } from '../../stores/toastStore';

const editProductSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(10),
  precio: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  categoriaId: z.coerce.number().int().positive(),
  marcaId: z.coerce.number().int().optional(), // Nuevo
  fotoFile: z.any().optional(),
});

type EditProductSchema = z.infer<typeof editProductSchema>;

interface EditProductFormProps { productId: string; }

export default function EditProductForm({ productId }: EditProductFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{id: number, nombre: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, nombre: string}[]>([]);
  const [currentImage, setCurrentImage] = useState<string>('');
  const addToast = useToastStore(s => s.addToast);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditProductSchema>({
    resolver: zodResolver(editProductSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
           fetch('http://localhost:3002/api/categories'),
           fetch('http://localhost:3002/api/brands'),
           fetch(`http://localhost:3002/api/products/${productId}`)
        ]);

        const catData = await catRes.json();
        const brandData = await brandRes.json();
        const prodData = await prodRes.json();
        
        if (catData.success) setCategories(catData.data);
        if (brandData.success) setBrands(brandData.data);

        if (prodData.success) {
          const p = prodData.data;
          setValue('nombre', p.nombre);
          setValue('descripcion', p.descripcion);
          setValue('precio', p.precio);
          setValue('stock', p.stock);
          setValue('categoriaId', p.categoriaId);
          setValue('marcaId', p.marcaId); // Cargar marca
          setCurrentImage(p.foto);
        } else {
            addToast('Producto no encontrado', 'error');
            navigate('/admin/nuevo');
        }
      } catch (error) {
        addToast('Error de conexión', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [productId, setValue]);

  const onSubmit = async (data: EditProductSchema) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('descripcion', data.descripcion);
      formData.append('precio', data.precio.toString());
      formData.append('stock', data.stock.toString());
      formData.append('categoriaId', data.categoriaId.toString());
      if (data.marcaId) formData.append('marcaId', data.marcaId.toString());

      if (data.fotoFile && data.fotoFile.length > 0) {
        formData.append('foto', data.fotoFile[0]);
      }

      const response = await fetch(`http://localhost:3002/api/products/${productId}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      addToast('Producto actualizado', 'success');
      await navigate(`/producto/${productId}`);
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-secondary border-b pb-2 flex justify-between">
        <span>Editar Producto</span>
        <span className="text-sm font-normal text-gray-500 self-end">ID: {productId}</span>
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre')} className="w-full mt-1 p-2 border rounded-md" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <div className="flex gap-4 items-center mt-2">
               {currentImage && <img src={currentImage} alt="Actual" className="w-16 h-16 object-cover rounded border" />}
               <div className="flex-grow">
                 <input type="file" accept="image/*" {...register('fotoFile')} className="w-full text-sm" />
                 <p className="text-xs text-gray-500 mt-1">Deja vacío para mantener.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea {...register('descripcion')} rows={4} className="w-full mt-1 p-2 border rounded-md"></textarea>
        </div>

        <div className="md:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/producto/${productId}`)} className="px-6 py-2 border rounded-md">Cancelar</button>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold">Guardar</button>
        </div>
      </form>
    </div>
  );
}