import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { API_URL, fetchApi } from '../../../utils/api';
import { useToastStore } from '../../../stores/toastStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';

export default function SupportInbox() {
    const { token } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // States for delete action
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchInquiries = () => {
        if (!token) return;

        setIsLoading(true);
        fetchApi('/technical')
            .then(res => res.json())
            .then(data => {
                if (data.success) setInquiries(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (token) fetchInquiries();
        else setIsLoading(false);
    }, [token]);

    const [isSending, setIsSending] = useState(false);

    const handleReply = async (id: number) => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            const res = await fetchApi(`/technical/${id}/reply`, {
                method: 'PUT',
                body: JSON.stringify({ respuesta: replyText })
            });
            if (res.ok) {
                addToast('Respuesta enviada', 'success');
                setReplyingTo(null);
                setReplyText('');
                fetchInquiries();
            }
        } catch (e) { addToast('Error al responder', 'error'); }
        finally { setIsSending(false); }
    };

    const handleDeleteClick = (id: number) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        setDeletingId(confirmDeleteId);
        try {
            const res = await fetchApi(`/technical/${confirmDeleteId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                addToast('Consulta eliminada', 'success');
                setInquiries(prev => prev.filter(i => i.id !== confirmDeleteId));
                setConfirmDeleteId(null);
            } else {
                addToast('Error al eliminar', 'error');
            }
        } catch (e) {
            addToast('Error de conexión', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando consultas...</div>;

    if (inquiries.length === 0) return (
        <div className="text-center p-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-500">No hay consultas técnicas pendientes.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                title="Eliminar Consulta"
                message="¿Estás seguro de eliminar esta consulta? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDanger
                isLoading={!!deletingId}
                onConfirm={confirmDelete}
                onCancel={() => !deletingId && setConfirmDeleteId(null)}
            />

            {inquiries.map(inq => (
                <div key={inq.id} className={`bg-white border p-6 rounded-xl shadow-sm transition-all ${inq.estado === 'PENDIENTE' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-500 opacity-75'}`}>
                    <div className="flex justify-between mb-3">
                        <div>
                            <span className="font-bold text-lg text-gray-800 block">{inq.asunto}</span>
                            <span className="text-xs text-gray-400">De: {inq.user?.nombre || 'Usuario'} ({inq.user?.email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded h-fit">
                                {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => handleDeleteClick(inq.id)}
                                disabled={!!deletingId && deletingId === inq.id}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 disabled:opacity-50"
                                title="Eliminar consulta"
                            >
                                {deletingId === inq.id ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
                                        <button onClick={() => setReplyingTo(null)} disabled={isSending} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 transition-all active:scale-95 disabled:opacity-50">Cancelar</button>
                                        <button onClick={() => handleReply(inq.id)} disabled={isSending} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
                                            {isSending ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Enviando...</> : 'Enviar Respuesta'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setReplyingTo(inq.id)} className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1 transition-all active:scale-95">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
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