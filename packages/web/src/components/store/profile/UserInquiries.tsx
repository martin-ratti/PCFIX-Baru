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
    }
  }, [token]);

  if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando consultas...</div>;

  if (inquiries.length === 0) return (
    <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-4">No has realizado consultas técnicas.</p>
        <a href="/servicios" className="text-blue-600 font-bold hover:underline">Ir a Servicio Técnico</a>
    </div>
  );

  return (
    <div className="space-y-4">
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