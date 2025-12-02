import React, { useEffect, useState } from 'react';
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
      <div className="flex items-center gap-3">
        <a 
          href="/login" 
          className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
        >
          Ingresar
        </a>
        <a 
          href="/registro" 
          className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Registrarse
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white py-1 px-4 rounded-full shadow-sm border border-gray-100">
      {/* Botón Admin (solo si aplica) */}
      {store.user?.role === 'ADMIN' && (
        <a href="/admin" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
          ADMIN
        </a>
      )}

      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right leading-tight">
          <span className="text-xs text-gray-400">Hola,</span>
          <span className="text-sm font-bold text-secondary truncate max-w-[100px]">
            {store.user?.nombre || 'Usuario'}
          </span>
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        <button 
          onClick={() => {
            store.logout();
            window.location.href = '/'; 
          }}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
          title="Cerrar Sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </div>
  );
}