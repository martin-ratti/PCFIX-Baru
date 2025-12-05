import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
// 👇 Volvemos a tu store
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';

interface ConfigData {
  nombreBanco: string;
  titular: string;
  cbu: string;
  alias: string;
  binanceAlias?: string;
  binanceCbu?: string;
  direccionLocal?: string;
  horariosLocal?: string;
  cotizacionUsdt?: number;
}

export default function ConfigForm() {
  const { register, handleSubmit, setValue } = useForm<ConfigData>();
  // 👇 Hook de tu store
  const addToast = useToastStore(s => s.addToast);
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if(token) {
        fetch('http://localhost:3002/api/config', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setValue('nombreBanco', data.data.nombreBanco);
              setValue('titular', data.data.titular);
              setValue('cbu', data.data.cbu);
              setValue('alias', data.data.alias);
              setValue('binanceAlias', data.data.binanceAlias);
              setValue('binanceCbu', data.data.binanceCbu);
              setValue('direccionLocal', data.data.direccionLocal);
              setValue('horariosLocal', data.data.horariosLocal);
              setValue('cotizacionUsdt', data.data.cotizacionUsdt);
            }
          })
          .catch(() => addToast('Error al cargar configuración', 'error'));
    }
  }, [setValue, token]);

  const onSubmit = async (data: ConfigData) => {
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:3002/api/config', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      
      if (json.success) {
        addToast('Configuración actualizada correctamente', 'success');
      } else {
        throw new Error(json.error || 'Fallo al guardar');
      }
    } catch (e: any) { 
        addToast(e.message || 'Error de conexión', 'error');
    }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
         {/* ... (El resto del JSX de los inputs se mantiene IDÉNTICO al anterior) ... */}
         {/* Si necesitas que te lo repita completo dímelo, pero solo cambió la lógica de arriba */}
         
         {/* SECCIÓN 1: BANCO */}
         <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">🏦</span> Transferencia Bancaria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700">Banco</label><input {...register('nombreBanco')} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Titular</label><input {...register('titular')} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">CBU</label><input {...register('cbu')} className="w-full mt-1 p-2 border rounded-lg font-mono" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Alias</label><input {...register('alias')} className="w-full mt-1 p-2 border rounded-lg uppercase font-bold" /></div>
            </div>
        </div>

        {/* SECCIÓN 2: CRYPTO */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">🪙</span> Crypto & Cotizaciones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700">Pay ID</label><input {...register('binanceCbu')} className="w-full mt-1 p-2 border rounded-lg font-mono" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Alias</label><input {...register('binanceAlias')} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700">1 USDT (ARS)</label><input type="number" {...register('cotizacionUsdt')} className="w-full mt-1 p-2 border rounded-lg font-bold text-green-600" /></div>
            </div>
        </div>

        {/* SECCIÓN 3: LOCAL */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">📍</span> Retiro en Local
            </h2>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Dirección</label><input {...register('direccionLocal')} className="w-full mt-1 p-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Horarios</label><input {...register('horariosLocal')} className="w-full mt-1 p-2 border rounded-lg" /></div>
            </div>
        </div>
        
        <div className="flex justify-end pt-4">
            <button disabled={isLoading} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50">
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
      </form>
    </div>
  );
}