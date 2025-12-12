import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

export default function UserSupportHistory() {
    const { token, user } = useAuthStore();
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (token) {
            loadInquiries();
        }
    }, [token]);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const res = await fetchApi('/technical/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInquiries(data.data);
            }
        } catch (error) {
            console.error("Error loading inquiries", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    if (isLoading) return <div className="text-center py-8 text-gray-400 animate-pulse">Cargando historial...</div>;

    if (inquiries.length === 0) return null; // Don't show empty section if no history (or maybe show empty state?)
    // Let's show empty state only if we really want to emphasize it, but "null" is cleaner if they haven't used it.
    // Actually, let's show it if we are already here.

    return (
        <div className="mt-16 border-t border-gray-200 pt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-3">
                <span className="w-2 h-8 bg-secondary rounded-full"></span>
                Historial de Consultas
            </h2>

            <div className="grid gap-6">
                {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{inq.asunto}</h3>
                                <span className="text-xs text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${inq.estado === 'RESPONDIDO'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {inq.estado}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-4">
                            "{inq.mensaje}"
                        </div>

                        {inq.respuesta && (
                            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r-xl">
                                <p className="text-xs text-green-700 font-bold mb-1">Respuesta de PCFIX:</p>
                                <p className="text-gray-700 text-sm">{inq.respuesta}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
