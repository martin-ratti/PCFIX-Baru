import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';

// CORRECCIÓN: Agregamos 'email' al esquema para que coincida con el formulario
const profileUpdateSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email().optional(), // Agregado para satisfacer a TS
});

type ProfileData = z.infer<typeof profileUpdateSchema>;

interface EditProfileFormProps {
  userId: string;
}

export default function EditProfileForm({ userId }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useToastStore(s => s.addToast);
  const authStore = useAuthStore();

  // Ahora el resolver y el tipo genérico coinciden perfectamente
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3002/api/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          const user = data.data;
          setValue('nombre', user.nombre);
          setValue('apellido', user.apellido);
          setValue('email', user.email); // TypeScript ahora permite esto felizmente
          addToast('Perfil cargado', 'info');
        } else {
          throw new Error('Error al cargar perfil');
        }
      } catch (e) {
        addToast('Error de conexión al cargar perfil', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId, setValue]);

  const onSubmit = async (data: ProfileData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3002/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: data.nombre,
            apellido: data.apellido,
            // No enviamos email porque no se edita, pero está en 'data' si lo necesitáramos
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        addToast('Perfil actualizado con éxito', 'success');
        
        if (authStore.user) {
            authStore.login(authStore.token as string, { ...authStore.user, nombre: data.nombre, apellido: data.apellido });
        }

      } else {
        throw new Error(result.error || 'Fallo al guardar');
      }

    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-3xl font-black text-secondary mb-6 border-b pb-3">Editar Mi Perfil</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('nombre')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido</label>
            <input {...register('apellido')} className="w-full mt-1 p-2 border rounded-md" />
            {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} disabled className="w-full mt-1 p-2 border rounded-md bg-gray-100 cursor-not-allowed" />
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 shadow-md"
        >
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}