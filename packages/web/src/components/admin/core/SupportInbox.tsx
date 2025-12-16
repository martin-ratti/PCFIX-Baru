import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { API_URL } from '../../../utils/api';
import { useToastStore } from '../../../stores/toastStore';

export default function SupportInbox() {
    const { token, logout } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInquiries = () => {
        // Evitar petición si no hay token (evita el 401 inicial)
        if (!token) return;

        setIsLoading(true);
        setError(null);

        fetch(`${API_URL}/technical`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(async (res) => {
                if (res.status === 401) {
                    logout(); // Token inválido -> Salir
                    window.location.href = '/auth/login';
                    throw new Error("Sesión expirada. Ingresa nuevamente.");
                }
                if (!res.ok) throw new Error("Error al cargar mensajes");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setInquiries(data.data);
                } else {
                    throw new Error(data.error);
                }
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                addToast(err.message, 'error');
            })
            .finally(() => setIsLoading(false));
    };

    // Efecto: Se dispara SOLO cuando el token cambia (o se carga inicialmente)
    useEffect(() => {
        if (token) fetchInquiries();
        else setIsLoading(false); // Si no hay token, dejamos de cargar (el Guard lo sacará)
    }, [token]);

    const handleReply = async (id: number) => {
        if (!replyText.trim()) return;
        try {
            const res = await fetch(`${API_URL}/technical/${id}/reply`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ respuesta: replyText })
            });
            const json = await res.json();
            if (json.success) {
                addToast('Respuesta enviada', 'success');
                setReplyingTo(null);
                setReplyText('');
                fetchInquiries();
            } else {
                throw new Error(json.error);
            }
        } catch (e: any) { addToast(e.message, 'error'); }
    };

    if (isLoading) return (
        <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Sincronizando bandeja...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-50 border border-red-100 rounded-lg text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchInquiries} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reintentar</button>
        </div>
    );

    if (inquiries.length === 0) return (
        <div className="text-center p-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4 grayscale opacity-50">📭</div>
            <h3 className="text-lg font-bold text-gray-600">Bandeja Limpia</h3>
            <p className="text-gray-400">No hay consultas técnicas pendientes de respuesta.</p>
            <button onClick={fetchInquiries} className="mt-4 text-sm text-blue-500 hover:underline">Actualizar</button>
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-700">Mensajes ({inquiries.length})</h2>
                <button onClick={fetchInquiries} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 4.992l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    Actualizar
                </button>
            </div>

            {inquiries.map(inq => (
                <div key={inq.id} className={`bg-white border p-6 rounded-xl shadow-sm transition-all hover:shadow-md ${inq.estado === 'PENDIENTE' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-500 opacity-75'}`}>
                    <div className="flex justify-between mb-3">
                        <div>
                            <span className="font-bold text-lg text-gray-800 block">{inq.asunto}</span>
                            <span className="text-xs text-gray-500">
                                De: <strong>{inq.user?.nombre || 'Usuario'} {inq.user?.apellido}</strong> • {new Date(inq.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full h-fit font-bold ${inq.estado === 'PENDIENTE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {inq.estado}
                        </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4 border border-gray-100 relative">
                        <span className="absolute top-2 left-2 text-gray-300 text-2xl leading-none">"</span>
                        <p className="px-4 relative z-10">{inq.mensaje}</p>
                    </div>

                    {inq.estado === 'RESPONDIDO' ? (
                        <div className="pl-4 border-l-2 border-green-200 mt-4">
                            <p className="text-xs text-green-700 font-bold mb-1 uppercase tracking-wider">Respuesta enviada:</p>
                            <p className="text-sm text-gray-600">{inq.respuesta}</p>
                        </div>
                    ) : (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {replyingTo === inq.id ? (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-bold text-gray-500">TU RESPUESTA:</label>
                                    <textarea
                                        className="w-full border border-blue-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                        placeholder="Escribe la solución técnica aquí..."
                                        rows={4}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setReplyingTo(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
                                        <button onClick={() => handleReply(inq.id)} className="bg-blue-600 text-white text-sm px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95">
                                            Enviar Respuesta
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-end">
                                    <button onClick={() => setReplyingTo(inq.id)} className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-200 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                        Responder Consulta
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}