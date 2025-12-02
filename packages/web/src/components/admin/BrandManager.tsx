import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../stores/toastStore';

interface Brand { id: number; nombre: string; logo: string | null; }

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { register, handleSubmit, reset } = useForm();
  const addToast = useToastStore(s => s.addToast);

  const fetchBrands = () => {
    fetch('http://localhost:3002/api/brands')
      .then(res => res.json())
      .then(data => data.success && setBrands(data.data));
  };

  useEffect(() => { fetchBrands(); }, []);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.logo[0]) formData.append('logo', data.logo[0]);

      const res = await fetch('http://localhost:3002/api/brands', {
        method: 'POST',
        body: formData
      });
      
      const json = await res.json();
      if (json.success) {
        addToast('Marca creada', 'success');
        reset();
        fetchBrands();
      } else {
        addToast(json.error, 'error');
      }
    } catch (e) { addToast('Error', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('¿Borrar marca?')) return;
    try {
      await fetch(`http://localhost:3002/api/brands/${id}`, { method: 'DELETE' });
      fetchBrands();
      addToast('Marca eliminada', 'success');
    } catch (e) { addToast('Error', 'error'); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-lg shadow h-fit">
        <h2 className="text-xl font-bold mb-4">Nueva Marca</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre', { required: true })} className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <input type="file" {...register('logo')} className="w-full mt-1 text-sm" />
          </div>
          <button className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-opacity-90">Crear</button>
        </form>
      </div>

      {/* Lista */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Marcas Existentes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {brands.map(b => (
            <div key={b.id} className="border rounded p-4 flex flex-col items-center justify-center relative group">
              <button onClick={() => handleDelete(b.id)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 text-xs font-bold">X</button>
              {b.logo ? <img src={b.logo} alt={b.nombre} className="h-12 object-contain mb-2"/> : <span className="text-2xl mb-2">🏢</span>}
              <span className="font-medium">{b.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}