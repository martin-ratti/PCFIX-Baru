import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function UserMenu() {
  // Asegúrate de importar bien el store
  const store = useAuthStore(); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("UserMenu: Montado en cliente"); // LOG 1
    setIsClient(true);
  }, []);

  // LOG 2
  console.log("UserMenu render:", { isClient, auth: store.isAuthenticated, user: store.user });

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
        <a href="/admin/nuevo" className="text-sm font-bold text-primary border border-primary px-3 py-1 rounded hover:bg-primary hover:text-white transition-colors">
          Panel Admin
        </a>
      )}

      <div className="text-right">
        <span className="block text-sm font-medium text-secondary">
          {store.user?.nombre || store.user?.email}
        </span>
        <button onClick={store.logout} className="text-xs text-red-500 hover:text-red-700 hover:underline">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}