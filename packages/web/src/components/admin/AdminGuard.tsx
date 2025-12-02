import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  // Estado inicial: Mostramos cargando hasta verificar bien
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // 1. Verificación rápida del Store en memoria
      if (isAuthenticated && user?.role === 'ADMIN') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // 2. Verificación de respaldo (LocalStorage)
      // A veces Zustand tarda unos ms en hidratar al recargar la página.
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          const storedUser = parsed.state?.user;
          
          if (storedUser?.role === 'ADMIN') {
            // Está en storage, esperamos a que Zustand se sincronice visualmente
            // pero no lo expulsamos.
            setIsAuthorized(true);
            setIsChecking(false);
            return;
          }
        } catch (e) {
          console.error("Error leyendo storage local", e);
        }
      }

      // 3. Si fallan ambas, expulsar.
      console.warn("AdminGuard: Acceso denegado o no autenticado.");
      navigate('/'); // Usamos navigate suave en lugar de window.location
    };

    // Pequeño delay para permitir hidratación si venimos de una navegación rápida
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);

  }, [isAuthenticated, user]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <p className="text-muted text-sm">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}