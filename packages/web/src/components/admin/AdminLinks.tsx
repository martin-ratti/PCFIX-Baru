import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function AdminLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex items-center justify-between w-full max-w-4xl">
      
      {/* GRUPO NAVEGACIÓN (Pestañas) */}
      <div className="flex items-center bg-gray-100/80 p-1 rounded-lg">
        <a href="/admin" className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
          Dashboard
        </a>

        <a href="/admin/productos" className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
          Inventario
        </a>

        <a href="/admin/categorias" className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all">
          Categorías
        </a>

        <a href="/admin/marcas" className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all">
          Marketing
        </a>
      </div>

      {/* GRUPO ACCIÓN (Botón Crear destacado) */}
      <div className="ml-6">
        <a href="/admin/nuevo" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Producto
        </a>
      </div>

    </div>
  );
}