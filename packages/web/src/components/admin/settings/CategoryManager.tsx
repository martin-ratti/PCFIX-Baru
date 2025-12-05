import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

interface Category { 
  id: number; 
  nombre: string; 
  subcategorias?: Category[];
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]); 
  const [flatCategories, setFlatCategories] = useState<Category[]>([]); 
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null); 
  
  const { register, handleSubmit, reset } = useForm();
  const addToast = useToastStore(s => s.addToast);

  const fetchData = async () => {
    try {
      // 👇 fetchApi (Lista árbol)
      const resTree = await fetchApi('/categories');
      const jsonTree = await resTree.json();
      if (jsonTree.success) setCategories(jsonTree.data);

      // 👇 fetchApi (Lista plana)
      const resFlat = await fetchApi('/categories?flat=true');
      const jsonFlat = await resFlat.json();
      if (jsonFlat.success) setFlatCategories(jsonFlat.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = { 
        nombre: data.nombre,
        padreId: data.padreId ? Number(data.padreId) : null 
      };

      // 👇 fetchApi (POST)
      const res = await fetchApi('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        addToast('Categoría creada', 'success');
        reset();
        fetchData();
      } else {
        addToast(json.error, 'error');
      }
    } catch (e) { addToast('Error al crear', 'error'); }
  };

  const requestDelete = (cat: Category) => setCategoryToDelete(cat);

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      // 👇 fetchApi (DELETE)
      await fetchApi(`/categories/${categoryToDelete.id}`, { method: 'DELETE' });
      fetchData();
      addToast('Categoría eliminada', 'success');
    } catch (e) { 
      addToast('Error al eliminar (¿Tiene productos?)', 'error'); 
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 sticky top-6">
        <h3 className="text-lg font-bold mb-4 text-secondary">Nueva Categoría</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre', { required: true })} className="w-full mt-1 p-2 border rounded focus:ring-primary focus:border-primary" placeholder="Ej: Periféricos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría Padre (Opcional)</label>
            <select {...register('padreId')} className="w-full mt-1 p-2 border rounded bg-white">
              <option value="">-- Es categoría principal --</option>
              {flatCategories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Si seleccionas una, será una subcategoría.</p>
          </div>
          <button className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-opacity-90 shadow-sm transition-all">Crear</button>
        </form>
      </div>

      {/* Lista */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Estructura del Catálogo</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-3 flex justify-between items-center font-bold text-secondary">
                <span className="flex items-center gap-2">📁 {cat.nombre}</span>
                <button onClick={() => requestDelete(cat)} className="text-red-500 hover:text-red-700 text-sm hover:bg-red-50 px-2 py-1 rounded transition-colors">Eliminar</button>
              </div>
              
              {cat.subcategorias && cat.subcategorias.length > 0 ? (
                <div className="bg-white p-2 pl-8 border-t border-gray-100 space-y-1">
                  {cat.subcategorias.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center text-sm text-gray-600 py-1.5 border-b last:border-0 border-gray-50 hover:bg-gray-50 px-2 rounded">
                      <span className="flex items-center gap-2">
                        <span className="text-gray-300">↳</span> {sub.nombre}
                      </span>
                      <button onClick={() => requestDelete(sub)} className="text-xs text-red-400 hover:text-red-600 hover:underline">Eliminar</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-2 pl-8 text-xs text-gray-400 italic">Sin subcategorías</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar "${categoryToDelete?.nombre}"?`}
        confirmText="Sí, Eliminar"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}