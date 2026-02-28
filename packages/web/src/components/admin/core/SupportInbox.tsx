import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { API_URL } from '../../../utils/api';
import { useToastStore } from '../../../stores/toastStore';
import { Inbox, RefreshCcw, Send, CornerUpLeft } from 'lucide-react';

export default function SupportInbox() {
    const { token, logout } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInquiries = () => {

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
                    logout();
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


    useEffect(() => {
        if (token) fetchInquiries();
        else setIsLoading(false);
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
            <RefreshCcw className="inline-block animate-spin h-8 w-8 text-blue-500 mb-4" />
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
            <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-200" />
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
                    <RefreshCcw className="w-4 h-4" />
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
                                        <CornerUpLeft className="w-4 h-4" />
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