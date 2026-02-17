import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import ServicePriceModal from '../../store/profile/ServicePriceModal';
import { ZapIcon, SettingsIcon } from '../../../components/SharedIcons';

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
            <ZapIcon className="w-5 h-5 text-yellow-600" />
            <span>Tarifas</span>
          </div>
        </ServicePriceModal>

        {/* Configuración */}
        <a href="/admin/configuracion" className={toolBtnClass} title="Configuración Global">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>Config</span>
        </a>
      </div>
    </div>
  );
}