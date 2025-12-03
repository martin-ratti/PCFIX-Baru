import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface UserGuardProps {
  children: React.ReactNode;
}

export default function UserGuard({ children }: UserGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      // Chequeo rápido en localStorage para evitar flash
      const storedAuth = localStorage.getItem('auth-storage');
      let role = user?.role;
      let isAuth = isAuthenticated;

      if (!isAuth && storedAuth) {
         try {
            const parsed = JSON.parse(storedAuth);
            isAuth = parsed.state.isAuthenticated;
            role = parsed.state.user?.role;
         } catch(e) {}
      }

      if (!isAuth) {
        // No logueado -> Replace a Login
        window.location.replace('/login');
        return;
      }

      if (role === 'ADMIN') {
        // Admin en zona de cliente -> Replace a Denegado
        window.location.replace('/acceso-denegado');
        return;
      }

      // Es User -> Permitir
      setIsLoading(false);
    };

    checkAccess();
  }, [isAuthenticated, user]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return <>{children}</>;
}