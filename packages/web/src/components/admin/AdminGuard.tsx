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
    // Validar si está logueado y si su rol es ADMIN
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      window.location.href = '/'; // Expulsado al home
    } else {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, [isAuthenticated, user]);

  if (isChecking) {
    return <div className="p-8 text-center text-gray-500">Verificando permisos...</div>;
  }

  return isAuthorized ? <>{children}</> : null;
}