import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { fetchApi } from '../../../utils/api';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import ChangePasswordModal from './ChangePasswordModal';
import { UserIcon, AlertTriangleIcon, LockIcon, InfoIcon, CrownIcon, MailIcon, KeyIcon, Trash2Icon } from '../../SharedIcons'; // 👇 Icons

const profileUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().optional(),
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

  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Read-only profile info
  const [role, setRole] = useState<string>('USER');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

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
        const res = await fetchApi(`/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          const user = data.data;
          setValue('nombre', user.nombre);
          setValue('apellido', user.apellido);
          setValue('telefono', user.telefono || '');
          setValue('email', user.email);
          setRole(user.role || 'USER');
          setCreatedAt(user.createdAt || '');
          setIsGoogleAccount(!!user.googleId);
        } else {
          throw new Error('Error al cargar perfil');
        }
      } catch (e) {
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
      const res = await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || undefined,
        }),
      });

      const result = await res.json();

      if (result.success) {
        addToast('Perfil actualizado con éxito', 'success');

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
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center text-primary-light border border-white/20 backdrop-blur-sm">
            <UserIcon className="w-8 h-8 text-white" />
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
              {errors.nombre && <p className="text-red-500 text-xs ml-1 font-medium flex items-center gap-1"><AlertTriangleIcon className="w-3 h-3" /> {errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Apellido</label>
              <input
                {...register('apellido')}
                className={`w-full px-4 py-3 bg-gray-50 border ${errors.apellido ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:ring-4 focus:bg-white outline-none transition-all duration-200 font-medium text-gray-800`}
                placeholder="Tu apellido"
              />
              {errors.apellido && <p className="text-red-500 text-xs ml-1 font-medium flex items-center gap-1"><AlertTriangleIcon className="w-3 h-3" /> {errors.apellido.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Teléfono</label>
              <input
                {...register('telefono')}
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl focus:ring-4 focus:bg-white outline-none transition-all duration-200 font-medium text-gray-800"
                placeholder="+54 11 1234-5678"
              />
              <p className="text-xs text-gray-400 ml-1">Lo usaremos para agilizar tus envíos.</p>
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
                <LockIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-gray-400 ml-1">El correo electrónico no se puede modificar por seguridad.</p>
          </div>

          {/* Information Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50">
            <h3 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs"><InfoIcon className="w-3 h-3" /></span>
              Información de la Cuenta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Rol</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
                  }`}>
                  {role === 'ADMIN' ? <CrownIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  {role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </span>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Miembro desde</p>
                <p className="text-sm font-semibold text-gray-700">
                  {createdAt ? new Date(createdAt).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Tipo de cuenta</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${isGoogleAccount
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-700'
                  }`}>
                  {isGoogleAccount ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      Google
                    </>
                  ) : (
                    <><MailIcon className="w-4 h-4" /> Email</>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs"><KeyIcon className="w-3 h-3" /></span>
              Seguridad
            </h3>

            {isGoogleAccount ? (
              <span className="text-sm text-gray-500 italic">Gestionado por Google</span>
            ) : (
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600 hover:shadow-lg hover:shadow-yellow-500/30 transition-all active:scale-95"
              >
                Cambiar Contraseña
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 transition-all active:scale-95 px-4 py-2 hover:bg-red-50 rounded-lg"
            >
              <Trash2Icon className="w-4 h-4" /> Eliminar cuenta
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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
        </form >
      </div >

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

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div >
  );
}