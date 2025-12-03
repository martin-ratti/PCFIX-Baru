import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../stores/toastStore';

interface ConfigData {
  nombreBanco: string;
  titular: string;
  cbu: string;
  alias: string;
}

export default function ConfigForm() {
  const { register, handleSubmit, setValue } = useForm<ConfigData>();
  const addToast = useToastStore(s => s.addToast);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3002/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setValue('nombreBanco', data.data.nombreBanco);
          setValue('titular', data.data.titular);
          setValue('cbu', data.data.cbu);
          setValue('alias', data.data.alias);
        }
      });
  }, [setValue]);

  const onSubmit = async (data: ConfigData) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3002/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Configuración guardada', 'success');
      } else {
        addToast('Error al guardar', 'error');
      }
    } catch (e) { addToast('Error de conexión', 'error'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-100">
      <h2 className="text-2xl font-bold text-secondary mb-6 border-b pb-2">Datos de Transferencia Bancaria</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Banco</label>
          <input {...register('nombreBanco')} className="w-full mt-1 p-2 border rounded-md focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Titular de la Cuenta</label>
          <input {...register('titular')} className="w-full mt-1 p-2 border rounded-md focus:ring-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">CBU / CVU</label>
            <input {...register('cbu')} className="w-full mt-1 p-2 border rounded-md focus:ring-primary font-mono" />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Alias</label>
            <input {...register('alias')} className="w-full mt-1 p-2 border rounded-md focus:ring-primary font-bold uppercase" />
            </div>
        </div>
        
        <div className="pt-4">
            <button disabled={isLoading} className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50">
                {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </div>
      </form>
    </div>
  );
}