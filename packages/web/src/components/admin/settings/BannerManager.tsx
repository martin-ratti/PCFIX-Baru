import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';
import ConfirmModal from '../../ui/feedback/ConfirmModal'; // 👇 Modal

interface Brand { id: number; nombre: string; }
interface Banner { id: number; imagen: string; marca: Brand; }

export default function BannerManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const addToast = useToastStore(s => s.addToast);
  const [bannerName, setBannerName] = useState<string | null>(null);
  
  // Estado para eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [brandRes, bannerRes] = await Promise.all([
          fetchApi('/brands'), 
          fetchApi('/banners')
      ]);
      const brandData = await brandRes.json();
      const bannerData = await bannerRes.json();
      if(brandData.success) setBrands(brandData.data);
      if(bannerData.success) setBanners(bannerData.data);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchData(); }, []);

  const bannerWatch = watch('imagenFile');
  useEffect(() => {
      if (bannerWatch && bannerWatch.length > 0) setBannerName(bannerWatch[0].name);
      else setBannerName(null);
  }, [bannerWatch]);

  const onSubmit = async (data: any) => {
    if(banners.length >= 5) { addToast("Límite de banners alcanzado (Máx 5)", 'error'); return; }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('marcaId', data.marcaId);
      if (data.imagenFile && data.imagenFile[0]) formData.append('imagen', data.imagenFile[0]);

      const res = await fetchApi('/banners', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        addToast('Banner creado', 'success');
        reset();
        setBannerName(null);
        fetchData();
      } else { throw new Error(json.error); }
    } catch (e: any) { addToast(e.message, 'error'); } finally { setIsLoading(false); }
  };

  const confirmDelete = async () => {
    if(!deleteId) return;
    try { 
        await fetchApi(`/banners/${deleteId}`, { method: 'DELETE' }); 
        fetchData(); 
        addToast('Banner eliminado', 'success'); 
    } catch (e) { addToast('Error', 'error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Nuevo Banner</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca a promocionar</label>
            <select {...register('marcaId', { required: "Selecciona una marca" })} className="w-full p-2 border rounded-md bg-white focus:ring-primary">
              <option value="">-- Seleccionar Marca --</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
            {errors.marcaId && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (Horizontal)</label>
            <input type="file" id="banner-upload" accept="image/*" {...register('imagenFile', { required: "Imagen requerida" })} className="hidden" />
            <label htmlFor="banner-upload" className="flex items-center justify-center w-full px-6 py-5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <div className="text-left">
                    <p className="font-bold truncate">{bannerName || "Subir imagen de banner"}</p>
                    <p className="text-xs font-normal opacity-70">Recomendado: 1200x400px</p>
                </div>
            </label>
            {errors.imagenFile && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>

          <button disabled={isLoading} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 shadow-sm">
            {isLoading ? 'Subiendo...' : 'Publicar Banner'}
          </button>
        </form>
      </div>

      {/* Visualización */}
      <div className="lg:col-span-2">
        <h3 className="text-lg font-bold mb-4 text-secondary flex justify-between">Banners Activos <span className="text-sm font-normal text-gray-500">{banners.length} / 5</span></h3>
        {banners.length === 0 ? ( <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"><p className="text-gray-400">No hay banners activos en el Home.</p></div> ) : (
        <div className="grid grid-cols-1 gap-6">
          {banners.map(b => (
            <div key={b.id} className="relative group rounded-xl overflow-hidden shadow-md bg-black">
              <button onClick={() => setDeleteId(b.id)} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-700 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              <img src={b.imagen} alt={`Banner ${b.marca.nombre}`} className="w-full h-48 object-cover opacity-90" />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4"><span className="text-white font-bold flex items-center gap-2">Link: <span className="bg-white/20 px-2 py-0.5 rounded text-sm uppercase backdrop-blur-sm">{b.marca.nombre}</span></span></div>
            </div>
          ))}
        </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId} 
        title="Eliminar Banner" 
        message="¿Estás seguro? Se eliminará del inicio." 
        confirmText="Sí, eliminar" 
        isDanger={true} 
        onConfirm={confirmDelete} 
        onCancel={() => setDeleteId(null)} 
      />
    </div>
  );
}