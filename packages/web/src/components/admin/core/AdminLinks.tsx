import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function AdminLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex items-center justify-between w-full max-w-5xl">
      
      {/* GRUPO NAVEGACIÓN */}
      <div className="flex items-center bg-gray-100/80 p-1 rounded-lg overflow-x-auto">
        <a href="/admin" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap">
          Dashboard
        </a>
        <a href="/admin/productos" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap">
          Inventario
        </a>
        <a href="/admin/categorias" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap">
          Categorías
        </a>
        <a href="/admin/marcas" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap">
          Marketing
        </a>
        
        {/* NUEVO BOTÓN DE CONFIGURACIÓN */}
        <a href="/admin/configuracion" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
          Config
        </a>
      </div>

      {/* GRUPO ACCIÓN */}
      <div className="ml-4">
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