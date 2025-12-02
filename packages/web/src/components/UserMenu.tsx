// packages/web/src/components/UserMenu.tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function UserMenu() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  // Evitar hidratación incorrecta
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // No renderizar nada en el servidor

  if (!isAuthenticated) {
    return (
      <div className="flex space-x-4">
        <a href="/login" className="text-secondary font-medium hover:text-primary transition-colors">
          Ingresar
        </a>
        <a 
          href="/registro" 
          className="bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-opacity-90 transition-colors text-sm"
        >
          Registrarse
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-secondary">
        Hola, {user?.nombre || user?.email}
      </span>
      <button 
        onClick={logout}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        Salir
      </button>
    </div>
  );
}