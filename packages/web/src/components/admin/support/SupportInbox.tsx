import React, { useState, useEffect } from 'react';
// Rutas corregidas:
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

export default function SupportInbox() {
  const { token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchInquiries = () => {
      // Evitamos llamar sin token
      if (!token) return;

      setIsLoading(true);
      fetch('http://localhost:3002/api/technical', {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => { 
          if(data.success) setInquiries(data.data); 
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  // Efecto que depende del token (para esperar a que cargue del storage)
  useEffect(() => { 
      if (token) fetchInquiries();
      else setIsLoading(false); // Si no hay token, dejamos de cargar
  }, [token]);

  const handleReply = async (id: number) => {
      if (!replyText.trim()) return;
      try {
          const res = await fetch(`http://localhost:3002/api/technical/${id}/reply`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ respuesta: replyText })
          });
          if (res.ok) {
              addToast('Respuesta enviada', 'success');
              setReplyingTo(null);
              setReplyText('');
              fetchInquiries();
          }
      } catch(e) { addToast('Error al responder', 'error'); }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando consultas...</div>;

  if (inquiries.length === 0) return (
    <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p className="text-gray-500">No hay consultas técnicas pendientes.</p>
    </div>
  );

  return (
    <div className="space-y-4">
        {inquiries.map(inq => (
            <div key={inq.id} className={`bg-white border p-6 rounded-xl shadow-sm transition-all ${inq.estado === 'PENDIENTE' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-500 opacity-75'}`}>
                <div className="flex justify-between mb-3">
                    <div>
                        <span className="font-bold text-lg text-gray-800 block">{inq.asunto}</span>
                        <span className="text-xs text-gray-400">De: {inq.user?.nombre || 'Usuario'} ({inq.user?.email})</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded h-fit">
                        {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4 italic border border-gray-100">
                    "{inq.mensaje}"
                </div>

                {inq.estado === 'RESPONDIDO' ? (
                    <div className="pl-4 border-l-2 border-green-200">
                        <p className="text-xs text-green-700 font-bold mb-1">Respuesta enviada:</p>
                        <p className="text-sm text-gray-600">{inq.respuesta}</p>
                    </div>
                ) : (
                    <div className="mt-4">
                        {replyingTo === inq.id ? (
                            <div className="space-y-3 animate-in fade-in">
                                <textarea 
                                    className="w-full border border-blue-200 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Escribe tu respuesta técnica aquí..." 
                                    rows={4}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setReplyingTo(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Cancelar</button>
                                    <button onClick={() => handleReply(inq.id)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-bold hover:bg-blue-700">Enviar Respuesta</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setReplyingTo(inq.id)} className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                Responder Consulta
                            </button>
                        )}
                    </div>
                )}
            </div>
        ))}
    </div>
  );
}