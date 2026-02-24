import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { fetchApi } from '../../../utils/api';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import { ImageIcon, BuildingIcon, Trash2Icon } from '../../SharedIcons'; 

interface Brand { id: number; nombre: string; logo: string | null; }

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { register, handleSubmit, reset } = useForm();
  const addToast = useToastStore(s => s.addToast);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrands = () => {
    fetchApi('/brands')
      .then(res => res.json())
      .then(data => data.success && setBrands(data.data));
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setLogoName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setLogoName(null);
      setPreviewUrl(null);
    }
  };


  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);

      const res = await fetchApi('/brands', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        addToast('Marca creada', 'success');
        reset();
        setLogoName(null);
        setPreviewUrl(null);
        fetchBrands();
      } else { addToast(json.error, 'error'); }
    } catch (e) { addToast('Error al crear marca', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetchApi(`/brands/${deleteId}`, { method: 'DELETE' });
      fetchBrands();
      addToast('Marca eliminada', 'success');
    } catch (e) { addToast('Error al eliminar', 'error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <div className="bg-white p-6 rounded-lg shadow h-fit border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Nueva Marca</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre', { required: true })} className="w-full mt-1 p-2 border rounded focus:ring-primary focus:border-primary" placeholder="Ej: Logitech" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Opcional)</label>
            <input
              type="file"
              id="brand-logo-upload"
              {...register('logo')}
              onChange={(e) => {
                register('logo').onChange(e);
                handleFileChange(e);
              }}
              className="hidden"
              accept="image/*"
            />
            <label htmlFor="brand-logo-upload" className="flex items-center justify-center w-full h-32 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all gap-2 text-sm relative overflow-hidden group">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain absolute z-0 p-2" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">Cambiar</div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="truncate max-w-[150px]">{logoName || "Seleccionar logo..."}</span>
                </div>
              )}
            </label>
          </div>

          <button disabled={isSubmitting} className="w-full bg-secondary text-white py-2 rounded-xl font-bold hover:bg-primary transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creando Marca...</> : 'Crear Marca'}
          </button>
        </form>
      </div>

      
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-secondary">Marcas Existentes ({brands.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(b => (
            <div key={b.id} className="border rounded-lg p-4 flex flex-col items-center justify-center relative group hover:shadow-md transition-shadow bg-gray-50">
              <button onClick={() => setDeleteId(b.id)} className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 rounded-full transition-all active:scale-90">
                <Trash2Icon className="w-4 h-4" />
              </button>
              <div className="h-12 flex items-center justify-center mb-2 w-full text-gray-300">
                {b.logo ? <img src={b.logo} alt={b.nombre} className="max-h-full max-w-full object-contain" /> : <BuildingIcon className="w-8 h-8" />}
              </div>
              <span className="font-medium text-sm text-center truncate w-full">{b.nombre}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Eliminar Marca"
        message="¿Borrar marca y quitarla de los productos?"
        confirmText="Sí, eliminar"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}