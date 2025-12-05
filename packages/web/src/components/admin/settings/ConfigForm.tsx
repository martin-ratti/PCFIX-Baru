import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner'; // Usamos sonner directamente
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
}

export default function ConfigForm() {
  const { register, handleSubmit, setValue } = useForm<ConfigData>();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if(token) {
        // Toast de carga inicial
        const toastId = toast.loading('Cargando configuración...');
        fetch('http://localhost:3002/api/config', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              // Seteo de valores
              setValue('nombreBanco', data.data.nombreBanco);
              setValue('titular', data.data.titular);
              setValue('cbu', data.data.cbu);
              setValue('alias', data.data.alias);
              setValue('binanceAlias', data.data.binanceAlias);
              setValue('binanceCbu', data.data.binanceCbu);
              setValue('direccionLocal', data.data.direccionLocal);
              setValue('horariosLocal', data.data.horariosLocal);
              toast.dismiss(toastId); 
            }
          })
          .catch(() => {
              toast.error('Error al cargar configuración', { id: toastId });
          });
    }
  }, [setValue, token]);

  const onSubmit = async (data: ConfigData) => {
    setIsLoading(true);
    const toastId = toast.loading('Guardando cambios...');
    
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
        toast.success('Configuración actualizada correctamente', { id: toastId });
      } else {
        throw new Error(json.error || 'Fallo al guardar');
      }
    } catch (e: any) { 
        toast.error(e.message || 'Error de conexión', { id: toastId });
    }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* SECCIÓN 1: BANCO TRADICIONAL */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">🏦</span> Transferencia Bancaria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Banco</label>
                  <input {...register('nombreBanco')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Titular</label>
                  <input {...register('titular')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">CBU / CVU</label>
                    <input {...register('cbu')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-mono transition-all" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Alias</label>
                    <input {...register('alias')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-bold uppercase transition-all" />
                </div>
            </div>
        </div>

        {/* SECCIÓN 2: BINANCE / CRYPTO */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">🪙</span> Binance Pay / Crypto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Binance Pay ID (o Email)</label>
                    <input {...register('binanceCbu')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none font-mono transition-all" placeholder="Ej: 123456789" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Alias / Usuario</label>
                    <input {...register('binanceAlias')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all" placeholder="Ej: TuUsuario" />
                </div>
            </div>
        </div>

        {/* SECCIÓN 3: LOCAL FÍSICO */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">📍</span> Retiro en Local
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección Completa</label>
                    <input {...register('direccionLocal')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" placeholder="Ej: Av. Corrientes 1234, CABA" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Horarios de Atención</label>
                    <input {...register('horariosLocal')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" placeholder="Ej: Lun a Vie 10-18hs" />
                </div>
            </div>
        </div>
        
        <div className="flex justify-end pt-4 sticky bottom-0 bg-gray-50 py-4 -mx-4 px-4 border-t border-gray-200 md:static md:bg-transparent md:border-0 md:p-0">
            <button disabled={isLoading} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none w-full md:w-auto">
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
      </form>
    </div>
  );
}