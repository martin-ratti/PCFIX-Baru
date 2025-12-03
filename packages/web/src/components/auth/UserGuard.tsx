import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

interface UserGuardProps {
  children: React.ReactNode;
}

export default function UserGuard({ children }: UserGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificación simple: ¿Está autenticado?
    if (!isAuthenticated) {
        // Chequeo doble con localStorage por si acaso (hidratación)
        const stored = localStorage.getItem('auth-storage');
        if (!stored || !JSON.parse(stored).state?.isAuthenticated) {
            navigate('/login'); // Expulsar
        }
    }
    setIsChecking(false);
  }, [isAuthenticated]);

  if (isChecking) return null; // O un spinner pequeño

  return <>{children}</>;
}