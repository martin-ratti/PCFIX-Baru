import { useState } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';
import { Lock, X } from 'lucide-react';
import { fetchApi } from '../../../utils/api';
import PasswordStrengthMeter from '../../ui/feedback/PasswordStrengthMeter';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof changePasswordSchema>;

function StrengthMeterController({ control }: { control: Control<FormData> }) {
    const password = useWatch({
        control,
        name: 'newPassword',
        defaultValue: ''
    });

    return <PasswordStrengthMeter password={password} />;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const addToast = useToastStore(s => s.addToast);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(changePasswordSchema)
    });

    if (!isOpen) return null;

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const res = await fetchApi('/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                }),
            });

            const json = await res.json();

            if (json.success) {
                addToast('Contraseña actualizada con éxito', 'success');
                reset();
                onClose();
            } else {
                throw new Error(json.error);
            }
        } catch (e: any) {
            addToast(e.message || 'Error al cambiar contraseña', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotClick = () => {
        setShowForgotModal(true);
    };

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-slide-up max-h-[90vh] overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>

                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-600" /> Cambiar Contraseña
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">


                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-bold text-gray-700">Contraseña Actual</label>
                                <button
                                    type="button"
                                    onClick={handleForgotClick}
                                    className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                            <input
                                {...register('currentPassword')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="********"
                            />
                            {errors.currentPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.currentPassword.message}</p>}
                        </div>


                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                            <input
                                {...register('newPassword')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="Mínimo 6 caracteres"
                            />
                            {errors.newPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.newPassword.message}</p>}
                            <StrengthMeterController control={control} />
                        </div>


                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                            <input
                                {...register('confirmPassword')}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="Repite la nueva contraseña"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="showPass"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="showPass" className="text-sm text-gray-600 cursor-pointer select-none">Mostrar contraseñas</label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    'Actualizar'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
        </>
    );
}

