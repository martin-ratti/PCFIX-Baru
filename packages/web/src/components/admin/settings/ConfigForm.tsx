import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

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
  const { token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 

  // 1. Carga Inicial
  useEffect(() => {
    if(token) {
        // 👇 fetchApi (GET)
        fetchApi('/config', {
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
          .catch(e => {
              console.error(e);
              // No es crítico mostrar error aquí, fetchApi ya manejó si fue 500
          });
    }
  }, [setValue, token]);

  // 2. Guardar Configuración
  const onSubmit = async (data: ConfigData) => {
    setIsLoading(true);
    try {
      // 👇 fetchApi (PUT)
      const res = await fetchApi('/config', {
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
        addToast(e.message || 'Error al guardar', 'error');
    }
    finally { setIsLoading(false); }
  };

  // 3. Sincronizar Binance
  const handleSyncUsdt = async (e: React.MouseEvent) => {
      e.preventDefault(); 
      setIsSyncing(true);
      
      try {
          // 👇 fetchApi (POST)
          const res = await fetchApi('/config/sync-usdt', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          
          if (json.success) {
              const nuevoValor = Number(json.data.cotizacionUsdt);
              setValue('cotizacionUsdt', nuevoValor);
              addToast(`¡Cotización actualizada a $${nuevoValor} ARS!`, 'success');
          } else {
              throw new Error(json.error);
          }
      } catch (e: any) {
          addToast('Error conectando con Binance', 'error');
      } finally {
          setIsSyncing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* BANCO */}
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

        {/* CRYPTO */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">🪙</span> Crypto & Cotizaciones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Binance Pay ID (o Email)</label>
                    <input {...register('binanceCbu')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none font-mono transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Alias / Usuario</label>
                    <input {...register('binanceAlias')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all" />
                </div>
                
                <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <label className="block text-sm font-bold text-yellow-800 mb-1">Cotización 1 USDT (ARS)</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600 font-bold">$</span>
                            <input 
                                type="number" 
                                {...register('cotizacionUsdt')} 
                                className="w-full pl-8 p-2 border border-yellow-200 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-yellow-400 outline-none" 
                                placeholder="1150" 
                            />
                        </div>
                        <button 
                            onClick={handleSyncUsdt}
                            disabled={isSyncing}
                            className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
                        >
                            {isSyncing ? (
                                <>
                                   <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                                   <span>Buscando...</span>
                                </>
                            ) : (
                                <>
                                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                   <span>Sincronizar Binance</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                        Este valor se usará para calcular el total en crypto en el checkout.
                    </p>
                </div>
            </div>
        </div>

        {/* LOCAL */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">📍</span> Retiro en Local
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección Completa</label>
                    <input {...register('direccionLocal')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Horarios de Atención</label>
                    <input {...register('horariosLocal')} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" />
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