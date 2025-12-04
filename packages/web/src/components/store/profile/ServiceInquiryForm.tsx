import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
// Rutas corregidas:
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { navigate } from 'astro:transitions/client';

export default function ServiceInquiryForm() {
  const { isAuthenticated, token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  if (!isAuthenticated) {
      return (
          <div className="text-center py-8">
              <div className="bg-gray-50 p-6 rounded-xl inline-block">
                  <p className="text-gray-600 mb-4 font-medium">Debes iniciar sesión para enviar una consulta técnica.</p>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-opacity-90">Iniciar Sesión</button>
                    <button onClick={() => navigate('/registro')} className="text-primary font-bold hover:underline px-4 py-2">Crear Cuenta</button>
                  </div>
              </div>
          </div>
      );
  }

  const onSubmit = async (data: any) => {
      setIsLoading(true);
      try {
          const res = await fetch('http://localhost:3002/api/technical', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(data)
          });
          const json = await res.json();
          
          if (json.success) {
              addToast('Consulta enviada. Te responderemos pronto.', 'success');
              reset();
          } else {
              throw new Error(json.error);
          }
      } catch (e: any) {
          addToast(e.message || 'Error al enviar', 'error');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <select {...register('asunto')} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white">
                <option value="Presupuesto Reparación">Presupuesto Reparación</option>
                <option value="Consulta Limpieza">Consulta Limpieza</option>
                <option value="Asesoramiento Armado">Asesoramiento Armado</option>
                <option value="Otro">Otro</option>
            </select>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea 
                {...register('mensaje', { required: true })} 
                rows={5} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Describe el problema de tu equipo o lo que necesitas..."
            ></textarea>
        </div>

        <button 
            disabled={isLoading} 
            className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50"
        >
            {isLoading ? 'Enviando...' : 'Enviar Consulta'}
        </button>
    </form>
  );
}