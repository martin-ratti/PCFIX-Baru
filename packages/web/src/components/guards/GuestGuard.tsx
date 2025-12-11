import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore'; // Importamos Toast
import { navigate } from 'astro:transitions/client';

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);

  // Optimización: Inicializamos estado basándonos en si existe el token en storage
  // Esto reduce el parpadeo de carga si el usuario no está logueado.
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      // Si NO hay datos en storage, no estamos logueados, mostrar form directo (false)
      return !!localStorage.getItem('auth-storage');
    }
    return true;
  });

  useEffect(() => {
    // Si Zustand ya confirmó que estamos autenticados
    if (isAuthenticated && user) {

      // 1. Mensaje Informativo REMOVIDO para evitar doble toast al loguearse
      // addToast(`Ya has iniciado sesión como ${user.nombre}`, 'info');

      // 2. Redirección (usamos replace para no ensuciar historial)
      const target = user.role === 'ADMIN' ? '/admin' : '/';

      // Pequeño delay para que se vea el toast antes de cambiar
      setTimeout(() => {
        // Usamos replace en lugar de navigate para que "Atrás" no vuelva al login
        window.location.replace(target);
      }, 500);

    } else {
      // Si no hay sesión, dejamos de cargar y mostramos el form
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    // Skeleton simple o spinner mientras verificamos
    return <div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return <>{children}</>;
}