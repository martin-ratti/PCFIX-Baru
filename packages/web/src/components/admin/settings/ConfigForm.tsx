import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

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
  const { register, handleSubmit, setValue, watch } = useForm<ConfigData>();
  const { token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 

  // Carga Inicial
  useEffect(() => {
    if(token) {
        fetchApi('/config', { headers: { 'Authorization': `Bearer ${token}` } })
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
              setValue('cotizacionUsdt', Number(data.data.cotizacionUsdt));
            }
          })
          .catch(console.error);
    }
  }, [setValue, token]);

  // Función Guardar General
  const onSubmit = async (data: ConfigData) => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Cambios guardados correctamente', 'success');
      } else throw new Error(json.error);
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setIsLoading(false); }
  };

  const handleSyncUsdt = async (e: React.MouseEvent) => {
      e.preventDefault(); 
      setIsSyncing(true);
      try {
          const res = await fetchApi('/config/sync-usdt', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const json = await res.json();
          
          if (json.success) {
              const nuevoValor = Number(json.data.cotizacionUsdt);
              setValue('cotizacionUsdt', nuevoValor);
              addToast(`¡Cotización actualizada a $${nuevoValor.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS!`, 'success');
          } else throw new Error(json.error);
      } catch (e: any) {
          addToast('Error conectando con CriptoYa', 'error');
      } finally { setIsSyncing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* === SECCIÓN BANCOS === */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🏦</span> Datos Bancarios
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Esta información se mostrará al cliente al elegir "Transferencia".</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700">Nombre del Banco</label>
                  <input {...register('nombreBanco')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej: Banco Nación" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700">Titular de la Cuenta</label>
                  <input {...register('titular')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej: Juan Perez" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700">CBU / CVU (22 dígitos)</label>
                    <input {...register('cbu')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-mono tracking-wide" placeholder="0000000000000000000000" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700">Alias</label>
                    <input {...register('alias')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none font-bold uppercase" placeholder="MI.ALIAS.MP" />
                </div>
            </div>

            {/* Botón Específico Banco */}
            <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isLoading} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                    💾 Guardar Datos Bancarios
                </button>
            </div>
        </div>

        {/* === SECCIÓN CRYPTO === */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🪙</span> Crypto & Cotizaciones
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Configura tu billetera y el valor del dólar cripto.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Binance Pay ID / Email</label>
                    <input {...register('binanceCbu')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none font-mono" placeholder="123456789" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Alias / Usuario</label>
                    <input {...register('binanceAlias')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400/30 outline-none" placeholder="@usuario" />
                </div>
                
                <div className="md:col-span-2 bg-yellow-50 p-5 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-black text-yellow-900 mb-2">Cotización 1 USDT (Precio ARS)</label>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[150px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-700 font-bold">$</span>
                            <input 
                                type="number" 
                                step="0.01"
                                {...register('cotizacionUsdt')} 
                                className="w-full pl-8 p-3 border border-yellow-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none text-lg bg-white" 
                                placeholder="1200.00" 
                            />
                        </div>
                        {/* Botón Descriptivo de Sync */}
                        <button 
                            onClick={handleSyncUsdt}
                            disabled={isSyncing}
                            className="bg-black text-yellow-400 px-5 py-3 rounded-lg font-bold text-sm hover:bg-gray-900 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 whitespace-nowrap"
                            title="Obtiene el precio de venta P2P actual"
                        >
                            {isSyncing ? (
                                <><div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div><span>Consultando...</span></>
                            ) : (
                                <><span className="text-lg">🔄</span><span>Obtener precio de Internet</span></>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-yellow-800 mt-2 font-medium">
                        * El sistema actualiza este valor automáticamente cada 4 horas usando la referencia P2P.
                    </p>
                </div>
            </div>

            {/* Botón Específico Crypto */}
            <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isLoading} className="text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold hover:bg-yellow-200 transition-colors">
                    💾 Guardar Configuración Crypto
                </button>
            </div>
        </div>

        {/* === SECCIÓN LOCAL === */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span className="text-2xl">📍</span> Retiro en Local
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Dirección Completa</label>
                    <input {...register('direccionLocal')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" placeholder="Calle 123, Ciudad" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Horarios de Atención</label>
                    <input {...register('horariosLocal')} className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400/30 outline-none transition-all" placeholder="Lun a Vie 9 a 18hs" />
                </div>
            </div>
            
            {/* Botón Específico Local */}
            <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isLoading} className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition-colors">
                    💾 Guardar Datos del Local
                </button>
            </div>
        </div>
        
        {/* Botón Flotante Global (Opcional, pero útil si cambiaste varias cosas) */}
        <div className="sticky bottom-4 z-10 flex justify-center">
            <button disabled={isLoading} className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none flex items-center gap-2">
                <span>💾</span> Guardar TODOS los Cambios
            </button>
        </div>

      </form>
    </div>
  );
}