import React, { useEffect, useState } from 'react';
// Asegúrate de que la ruta al store sea correcta según tu estructura actual
import { useAuthStore } from '../../stores/authStore';

export default function UserMenu() {
  const store = useAuthStore(); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  if (!store.isAuthenticated) {
    return (
      <div className="flex space-x-4">
        <a href="/login" className="text-secondary font-medium hover:text-primary transition-colors">
          Ingresar
        </a>
        <a href="/registro" className="bg-primary text-white px-4 py-2 rounded-md font-bold hover:bg-opacity-90 transition-colors text-sm">
          Registrarse
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Botón Admin */}
      {store.user?.role === 'ADMIN' && (
        <a href="/admin/nuevo" className="text-xs font-bold text-primary border border-primary px-3 py-1 rounded hover:bg-primary hover:text-white transition-colors">
          Panel Admin
        </a>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-secondary">
          Hola, {store.user?.nombre || store.user?.email}
        </span>
        <span className="text-gray-300">|</span>
        <button 
          onClick={store.logout}
          className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}