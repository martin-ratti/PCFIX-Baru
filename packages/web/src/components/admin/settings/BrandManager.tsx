import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

interface Brand { id: number; nombre: string; logo: string | null; }

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { register, handleSubmit, reset, watch } = useForm();
  const addToast = useToastStore(s => s.addToast);
  const [logoName, setLogoName] = useState<string | null>(null);

  const fetchBrands = () => {
    // 👇 fetchApi
    fetchApi('/brands')
      .then(res => res.json())
      .then(data => data.success && setBrands(data.data));
  };

  useEffect(() => { fetchBrands(); }, []);

  const logoWatch = watch('logo');
  useEffect(() => {
      if (logoWatch && logoWatch.length > 0) setLogoName(logoWatch[0].name);
      else setLogoName(null);
  }, [logoWatch]);


  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);

      // 👇 fetchApi con FormData
      const res = await fetchApi('/brands', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        addToast('Marca creada', 'success');
        reset();
        setLogoName(null);
        fetchBrands();
      } else { addToast(json.error, 'error'); }
    } catch (e) { addToast('Error al crear marca', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('¿Borrar marca?')) return;
    try {
      // 👇 fetchApi DELETE
      await fetchApi(`/brands/${id}`, { method: 'DELETE' });
      fetchBrands();
      addToast('Marca eliminada', 'success');
    } catch (e) { addToast('Error al eliminar', 'error'); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-lg shadow h-fit border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Nueva Marca</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre', { required: true })} className="w-full mt-1 p-2 border rounded focus:ring-primary focus:border-primary" placeholder="Ej: Logitech" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Opcional)</label>
            <input type="file" id="brand-logo-upload" {...register('logo')} className="hidden" accept="image/*" />
            <label htmlFor="brand-logo-upload" className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2 text-sm">
                <span className="text-2xl">🖼️</span>
                <span className="truncate">{logoName || "Seleccionar logo..."}</span>
            </label>
          </div>

          <button className="w-full bg-secondary text-white py-2 rounded-xl font-bold hover:bg-primary transition-colors shadow-sm">Crear Marca</button>
        </form>
      </div>

      {/* Lista */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Marcas Existentes ({brands.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(b => (
            <div key={b.id} className="border rounded-lg p-4 flex flex-col items-center justify-center relative group hover:shadow-md transition-shadow bg-gray-50">
              <button onClick={() => handleDelete(b.id)} className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              <div className="h-12 flex items-center justify-center mb-2 w-full">
                 {b.logo ? <img src={b.logo} alt={b.nombre} className="max-h-full max-w-full object-contain"/> : <span className="text-2xl">🏢</span>}
              </div>
              <span className="font-medium text-sm text-center truncate w-full">{b.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}