import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      // 1. Chequeo Memoria
      if (isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // 2. Chequeo Disco (LocalStorage)
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed.state?.isAuthenticated) {
            setIsLoading(false);
            return;
          }
        } catch (e) { }
      }

      // 3. No logueado -> Login
      window.location.href = '/auth/login';
    };

    checkAccess();
  }, [isAuthenticated]);

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return <>{children}</>;
}