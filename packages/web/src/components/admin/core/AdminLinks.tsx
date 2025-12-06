import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import ServicePriceModal from '../../store/profile/ServicePriceModal';

export default function AdminLinks() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  if (!isClient || user?.role !== 'ADMIN') return null;

  const navLinkClass = "text-sm font-bold text-gray-500 hover:text-black transition-colors px-3 py-2 rounded-lg hover:bg-gray-100";
  
  // Clase unificada para ambos botones de herramientas
  const toolBtnClass = "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-black transition-all border border-gray-200 cursor-pointer h-full";

  return (
    <div className="flex items-center ml-2 h-10">
      
      {/* 1. Navegación Principal */}
      <nav className="hidden xl:flex items-center gap-1">
        <a href="/admin" className={navLinkClass}>Dashboard</a>
        <a href="/admin/productos" className={navLinkClass}>Inventario</a>
        <a href="/admin/categorias" className={navLinkClass}>Categorías</a>
        <a href="/admin/marcas" className={navLinkClass}>Marketing</a>
        <a href="/admin/soporte" className={navLinkClass}>Soporte</a>
      </nav>

      {/* Separador */}
      <div className="h-6 w-px bg-gray-300 mx-3 hidden lg:block"></div>

      {/* 2. Herramientas (Botones Claros) */}
      <div className="flex items-center gap-2">
        
        {/* Modal de Tarifas (Envolvemos el diseño del botón) */}
        <ServicePriceModal>
            <div className={toolBtnClass} title="Actualizar Tarifas">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-600">
                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
                </svg>
                <span>Tarifas</span>
            </div>
        </ServicePriceModal>

        {/* Configuración */}
        <a href="/admin/configuracion" className={toolBtnClass} title="Configuración Global">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
                <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span>Config</span>
        </a>
      </div>
    </div>
  );
}