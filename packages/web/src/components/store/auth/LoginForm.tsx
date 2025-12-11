import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import GoogleLoginButton from './GoogleLoginButton';
import ForgotPasswordModal from './ForgotPasswordModal';
import { API_URL } from '../../../utils/api';

// const API_URL = 'https://pcfix-baru-production.up.railway.app/api';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotResult, setShowForgotResult] = useState(false);

  const login = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);

  const { register, handleSubmit, formState: { errors, touchedFields, dirtyFields } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const getFieldStatus = (fieldName: keyof LoginSchema) => {
    const isError = !!errors[fieldName];
    const isValid = !isError && (touchedFields[fieldName] || dirtyFields[fieldName]);
    return { isError, isValid };
  };

  const getInputClasses = (fieldName: keyof LoginSchema) => {
    const { isError, isValid } = getFieldStatus(fieldName);
    const baseClasses = "mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors";

    if (isError) {
      return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50`;
    }
    if (isValid) {
      return `${baseClasses} border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50`;
    }
    return `${baseClasses} border-gray-300 focus:ring-primary focus:border-primary`;
  };

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" method="POST">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <input
              id="email"
              data-testid="input-email"
              {...register('email')}
              type="email"
              className={getInputClasses('email')}
              placeholder="tu@email.com"
            />
            {getFieldStatus('email').isValid && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <button
              type="button"
              onClick={() => setShowForgotResult(true)}
              className="text-xs text-primary font-bold hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              data-testid="input-password"
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={getInputClasses('password')}
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="w-full py-2 px-4 rounded-md text-white bg-primary hover:bg-opacity-90 disabled:opacity-50 font-bold transition-transform active:scale-95 duration-200 flex justify-center items-center">
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando...
            </span>
          ) : 'Entrar'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O continúa con</span></div>
      </div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-sm text-gray-600">¿No tienes cuenta? <a href="/auth/registro" className="text-primary font-bold hover:underline">Regístrate</a></p>

      <ForgotPasswordModal isOpen={showForgotResult} onClose={() => setShowForgotResult(false)} />
    </div>
  );
}