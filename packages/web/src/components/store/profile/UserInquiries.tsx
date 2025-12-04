import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function UserInquiries() {
  const { token } = useAuthStore();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
        fetch('http://localhost:3002/api/technical/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) setInquiries(data.data);
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [token]);

  if (isLoading) return <div className="p-8 text-center animate-pulse text-gray-400">Cargando consultas...</div>;

  // --- ESTADO VACÍO ESTANDARIZADO ---
  if (inquiries.length === 0) return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
            {/* Icono Soporte / Chat */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">No has realizado consultas técnicas</h3>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            ¿Tienes dudas sobre una reparación o upgrade? Nuestros técnicos están listos para ayudarte.
        </p>
        
        {/* Botón Sólido (Igual a Favoritos y Ventas) */}
        <a 
            href="/servicio-tecnico" 
            className="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
        >
            Ir a Servicio Técnico
        </a>
    </div>
  );

  // --- LISTA DE CONSULTAS (SI HAY DATOS) ---
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
        {inquiries.map(inq => (
            <div key={inq.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-gray-800">{inq.asunto}</h3>
                        <span className="text-xs text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inq.estado === 'RESPONDIDO' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                        {inq.estado === 'RESPONDIDO' ? 'Respuesta Disponible' : 'Pendiente'}
                    </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 italic">
                    "{inq.mensaje}"
                </div>

                {inq.estado === 'RESPONDIDO' && inq.respuesta && (
                    <div className="mt-4 pl-4 border-l-4 border-blue-500">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Respuesta de PCFIX:</p>
                        <p className="text-sm text-gray-800 leading-relaxed">{inq.respuesta}</p>
                        {inq.respondedAt && (
                            <p className="text-xs text-gray-400 mt-2">Respondido el {new Date(inq.respondedAt).toLocaleDateString()}</p>
                        )}
                    </div>
                )}
            </div>
        ))}
    </div>
  );
}