import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import ServicePriceModal from '../../store/profile/ServicePriceModal';

export default function AdminLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role !== 'ADMIN') return null;

  const linkClass = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-100 transition-all whitespace-nowrap";

  return (
    <div className="flex items-center justify-between w-full gap-4">
      
      {/* Navegación */}
      <nav className="flex items-center gap-1 p-1">
        <a href="/admin" className={linkClass}>Dashboard</a>
        <a href="/admin/productos" className={linkClass}>Inventario</a>
        <a href="/admin/categorias" className={linkClass}>Categorías</a>
        <a href="/admin/marcas" className={linkClass}>Marketing</a>
        <a href="/admin/soporte" className={linkClass}>Soporte</a>
        <a href="/admin/configuracion" className={linkClass} title="Configuración">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
        </a>
      </nav>

      {/* Acciones */}
      <div className="ml-auto pl-4 flex items-center gap-3 border-l border-gray-200">
        
        <ServicePriceModal />

        {/* Botón POS */}
        <a 
            href="/admin/nueva-venta" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-700 shadow-md transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
          POS / Venta Manual
        </a>

        <a 
            href="/admin/nuevo" 
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 shadow-md transition-all"
        >
          + Producto
        </a>
      </div>
    </div>
  );
}