import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility
import ConfirmModal from '../../ui/feedback/ConfirmModal';

const profileUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email().optional(),
});

type ProfileData = z.infer<typeof profileUpdateSchema>;

interface EditProfileFormProps {
  userId: string;
}

export default function EditProfileForm({ userId }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const addToast = useToastStore(s => s.addToast);
  const authStore = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileUpdateSchema),
  });

  const handleDeleteAccount = async () => {
    try {
      const res = await fetchApi('/auth/profile', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        addToast('Cuenta eliminada. Te vamos a extrañar 👋', 'info');
        authStore.logout();
        window.location.href = '/';
      } else {
        throw new Error(data.error || 'No se pudo eliminar la cuenta');
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // 1. Cargar datos del perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 👇 fetchApi (GET)
        const res = await fetchApi(`/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          const user = data.data;
          setValue('nombre', user.nombre);
          setValue('apellido', user.apellido);
          setValue('email', user.email);
        } else {
          throw new Error('Error al cargar perfil');
        }
      } catch (e) {
        // Error manejado por fetchApi o log local
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId, setValue, addToast]);

  // 2. Guardar cambios
  const onSubmit = async (data: ProfileData) => {
    setIsSaving(true);

    try {
      // 👇 fetchApi (PUT)
      const res = await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          apellido: data.apellido,
        }),
      });

      const result = await res.json();

      if (result.success) {
        addToast('Perfil actualizado con éxito', 'success');

        // Actualizamos el store local
        if (authStore.user) {
          authStore.login(authStore.token as string, {
            ...authStore.user,
            nombre: data.nombre,
            apellido: data.apellido
          });
        }
      } else {
        throw new Error(result.error || 'Fallo al guardar');
      }

    } catch (error: any) {
      addToast(error.message || 'Error al actualizar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-400 font-medium">Cargando tu perfil...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden max-w-3xl mx-auto animate-fade-in-up">

      <div className="bg-gradient-to-r from-blue-800 to-sky-500 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center text-2xl border border-white/20 backdrop-blur-sm">
            👤
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Editar Mi Perfil</h2>
            <p className="text-blue-100 text-sm font-medium">Actualiza tu información personal para tus pedidos.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Nombre</label>
              <div className="relative">
                <input
                  {...register('nombre')}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.nombre ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:ring-4 focus:bg-white outline-none transition-all duration-200 font-medium text-gray-800`}
                  placeholder="Tu nombre"
                />
              </div>
              {errors.nombre && <p className="text-red-500 text-xs ml-1 font-medium flex items-center gap-1">⚠️ {errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Apellido</label>
              <input
                {...register('apellido')}
                className={`w-full px-4 py-3 bg-gray-50 border ${errors.apellido ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:ring-4 focus:bg-white outline-none transition-all duration-200 font-medium text-gray-800`}
                placeholder="Tu apellido"
              />
              {errors.apellido && <p className="text-red-500 text-xs ml-1 font-medium flex items-center gap-1">⚠️ {errors.apellido.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Correo Electrónico</label>
            <div className="relative group">
              <input
                {...register('email')}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-mono text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors">
                🔒
              </div>
            </div>
            <p className="text-xs text-gray-400 ml-1">El correo electrónico no se puede modificar por seguridad.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 transition-colors px-4 py-2 hover:bg-red-50 rounded-lg"
            >
              🗑️ Eliminar cuenta
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>Guardar Cambios</>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="¿Eliminar Cuenta?"
        message="Esta acción es irreversible. Se perderá tu historial si no tienes pedidos activos. Si tienes pedidos en curso, no podrás eliminarla."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </div>
  );
}