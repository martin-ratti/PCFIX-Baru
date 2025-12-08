import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
// Nota: No usamos navigate de Astro aquí para poder usar .replace() nativo
// y evitar el loop de "Volver atrás"

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // 1. Check Store
      if (isAuthenticated && user?.role === 'ADMIN') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // 2. Check Storage (Respaldo por si recarga)
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          const storedUser = parsed.state?.user;

          if (storedUser?.role === 'ADMIN') {
            setIsAuthorized(true);
            setIsChecking(false);
            return;
          }
        } catch (e) { console.error(e); }
      }

      // 3. Fallo: Redirección DESTRUCTIVA (Replace)
      // Esto evita el bucle infinito al dar "Atrás"
      if (!isAuthenticated) {
        window.location.replace('/auth/login');
      } else {
        // Logueado pero sin permisos
        window.location.replace('/acceso-denegado');
      }
    };

    checkAuth();
  }, [isAuthenticated, user]);

  if (isChecking) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;
  }

  return isAuthorized ? <>{children}</> : null;
}