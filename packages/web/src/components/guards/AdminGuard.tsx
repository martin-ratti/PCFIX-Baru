import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';



interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      
      if (isAuthenticated && user?.role === 'ADMIN') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      
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

      
      
      if (!isAuthenticated) {
        window.location.replace('/auth/login');
      } else {
        
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