import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const schema = z.object({
    email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

const API_URL = 'https://pcfix-baru-production.up.railway.app/api';

export default function ForgotPasswordModal({ isOpen, onClose }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const addToast = useToastStore(s => s.addToast);
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

    if (!isOpen) return null;

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (json.success) {
                addToast('Correo enviado. Revisa tu bandeja de entrada.', 'success');
                onClose();
            } else {
                throw new Error(json.error);
            }
        } catch (e: any) {
            addToast(e.message || 'Error al enviar correo', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

                <h2 className="text-xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h2>
                <p className="text-sm text-gray-500 mb-6">Ingresa tu email y te enviaremos las instrucciones.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="tu@email.com"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Enviando...</> : 'Enviar Instrucciones'}
                    </button>
                </form>
            </div>
        </div>
    );
}
