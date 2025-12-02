import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log("🛡️ AdminGuard Check:", { isAuthenticated, role: user?.role });

      // 1. Verificación Directa (Store en memoria)
      if (isAuthenticated && user?.role === 'ADMIN') {
        console.log("✅ Acceso concedido por Store");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // 2. Verificación de Respaldo (LocalStorage)
      // Esto salva el "race condition" cuando recargas la página
      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          const storedUser = parsed.state?.user;
          
          console.log("💾 LocalStorage Check:", storedUser?.role);

          if (storedUser?.role === 'ADMIN') {
            // Confiamos en el storage mientras Zustand termina de hidratar
            setIsAuthorized(true);
            setIsChecking(false);
            return;
          }
        } catch (e) {
          console.error("Error leyendo storage", e);
        }
      }

      // 3. Si falla todo, expulsar
      console.warn("⛔ Acceso denegado. Redirigiendo al home...");
      setIsChecking(false);
      navigate('/'); 
    };

    // Pequeño delay para dar tiempo a la hidratación
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