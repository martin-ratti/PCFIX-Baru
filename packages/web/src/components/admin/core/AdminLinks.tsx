import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';

export default function AdminLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role !== 'ADMIN') return null;

  const linkClass = "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all whitespace-nowrap";

  return (
    <div className="flex items-center justify-between w-full max-w-5xl">
      
      {/* NAVEGACIÓN */}
      <div className="flex items-center bg-gray-100/80 p-1 rounded-lg overflow-x-auto scrollbar-hide">
        <a href="/admin" className={linkClass}>Dashboard</a>
        <a href="/admin/productos" className={linkClass}>Inventario</a>
        <a href="/admin/categorias" className={linkClass}>Categorías</a>
        <a href="/admin/marcas" className={linkClass}>Marketing</a>
        <a href="/admin/soporte" className={linkClass}>Soporte</a>
        <a href="/admin/configuracion" className={linkClass}>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
        </a>
      </div>

      {/* ACCIÓN PRINCIPAL */}
      <div className="ml-4">
        <a href="/admin/nuevo" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 shadow-md transition-all hover:-translate-y-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {/* CORRECCIÓN DE TEXTO */}
          <span>Crear Producto</span> 
        </a>
      </div>
    </div>
  );
}