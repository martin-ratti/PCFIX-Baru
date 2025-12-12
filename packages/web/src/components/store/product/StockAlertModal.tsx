import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';

interface StockAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
}

export default function StockAlertModal({ isOpen, onClose, productId, productName }: StockAlertModalProps) {
    const { user, isAuthenticated } = useAuthStore();

    // State
    const [email, setEmail] = useState(user?.email || '');
    const [isEditing, setIsEditing] = useState(!isAuthenticated); // If not auth, edit by default. If auth, view mode.
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user?.email && !email) setEmail(user.email);
    }, [user]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetchApi('/products/alert/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email: isEditing ? email : user?.email, productId })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                }, 2500);
            } else {
                setError(data.message || 'Error al suscribirse');
            }
        } catch (err) {
            setError('Ocurrió un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ margin: 0 }}>
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Forced Light Theme Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-enter border border-gray-100 relative z-10">

                <div className="p-6 text-center">
                    {/* Icon */}
                    {!success && (
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {success ? '¡Listo!' : 'Avísame del Stock'}
                    </h3>

                    {!success && (
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Te notificaremos cuando <strong>{productName}</strong> esté disponible nuevamente.
                        </p>
                    )}

                    {success ? (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-gray-600 font-medium">¡Te avisaremos pronto!</p>
                        </div>
                    ) : (
                        <>
                            {/* Email Selection */}
                            <div className="mb-6 text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Enviar a</label>

                                {isEditing ? (
                                    <div className="relative">
                                        <input
                                            type="email"
                                            autoFocus
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-gray-900 bg-white"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                        />
                                        {isAuthenticated && (
                                            <button onClick={() => { setEmail(user?.email || ''); setIsEditing(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-all active:scale-90">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 group cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setIsEditing(true)}>
                                        <span className="text-gray-900 font-medium truncate flex-1">{email}</span>
                                        <button className="p-2 text-gray-400 group-hover:text-primary transition-all active:scale-90 rounded-full hover:bg-gray-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-red-500 text-xs mb-4 bg-red-50 p-2 rounded-lg">{error}</p>}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={loading || !email.includes('@')}
                                    className="px-4 py-3 rounded-xl font-bold text-white bg-primary hover:bg-opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /></> : (isEditing ? 'Guardar' : 'Confirmar')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
