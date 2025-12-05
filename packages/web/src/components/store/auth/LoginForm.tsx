import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import GoogleLoginButton from './GoogleLoginButton';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    try {
      // 👇 Uso de fetchApi (Más limpio, sin URL base)
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      login(result.data.token, result.data.user);
      addToast(`¡Bienvenido, ${result.data.user.nombre}!`, 'success');
      
      setTimeout(() => {
          if (result.data.user.role === 'ADMIN') window.location.href = '/admin';
          else window.location.href = '/';
      }, 100);
      
    } catch (err: any) {
      addToast(err.message || 'Error al iniciar sesión', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6 text-secondary">Iniciar Sesión</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} type="email" className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-primary" placeholder="tu@email.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input {...register('password')} type="password" className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-primary" placeholder="********" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="w-full py-2 px-4 rounded-md text-white bg-primary hover:bg-opacity-90 disabled:opacity-50 font-bold transition-colors">
          {isLoading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O continúa con</span></div>
      </div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-sm text-gray-600">¿No tienes cuenta? <a href="/registro" className="text-primary font-bold hover:underline">Regístrate</a></p>
    </div>
  );
}