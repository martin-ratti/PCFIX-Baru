import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'sonner';

import { fetchApi } from '../../../utils/api'; // 👇 API Utility

export default function ServiceInquiryForm() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    asunto: 'Presupuesto Reparación',
    mensaje: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mensaje.trim()) {
      toast.error('Por favor detalla tu problema para poder ayudarte.');
      return;
    }

    if (!user || !token) {
      sessionStorage.setItem('pendingInquiry', JSON.stringify(formData));
      toast.info('Necesitas iniciar sesión para enviar consultas. Redirigiendo...', { duration: 2000 });
      setTimeout(() => { window.location.href = '/auth/login'; }, 1500);
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Enviando consulta al taller...');

    try {
      // 👇 fetchApi
      const res = await fetchApi('/technical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('¡Consulta recibida! Te responderemos pronto.', { id: toastId });
        setFormData({ ...formData, mensaje: '' });
      } else {
        throw new Error(data.error || 'Error al enviar');
      }

    } catch (error: any) {
      toast.error(error.message || 'Error de conexión', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Asunto</label>
        <div className="relative">
          <select
            value={formData.asunto}
            onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer text-gray-700 font-medium"
          >
            <option>Presupuesto Reparación</option>
            <option>Mantenimiento / Limpieza</option>
            <option>Upgrade de PC</option>
            <option>Instalación de Software</option>
            <option>Consulta General</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Detalle del Problema</label>
        <textarea
          rows={5}
          value={formData.mensaje}
          onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
          placeholder="Hola, tengo una PC que hace un ruido extraño al encender y..."
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-gray-700 placeholder-gray-400"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary/30 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <span>Enviar Consulta</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </>
        )}
      </button>

      {!user && (
        <p className="text-xs text-center text-gray-400 mt-2">
          * Se te pedirá iniciar sesión antes de enviar.
        </p>
      )}

    </form>
  );
}