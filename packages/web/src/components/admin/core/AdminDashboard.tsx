import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { useAuthStore } from "../../../stores/authStore";
import { fetchApi } from '../../../utils/api';
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';
import SalesChart from './SalesChart';

import DashboardIntelligence from '../dashboard/DashboardIntelligence';

function DashboardContent() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          {/* Title is now inside DashboardIntelligence for better cohesive design, or we can keep it here. 
               DashboardIntelligence has its own header "Inteligencia de Ventas". 
               Let's keep the user welcome here but remove the "Panel de Control" title to avoid duplication if DashboardIntelligence has one.
               Actually DashboardIntelligence has a full header. I'll render the welcome message small above it or let DashboardIntelligence handle it.
           */}
          <p className="text-gray-500 text-sm">Bienvenido de nuevo, <span className="font-bold text-gray-800">{user?.nombre || 'Administrador'}</span></p>
        </div>
      </div>

      {/* INTELLIGENCE DASHBOARD */}
      <DashboardIntelligence />

      {/* 4. ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">

        {/* Nuevo Producto */}
        <a href="/admin/nuevo" className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all active:scale-95 group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-1">Nuevo Producto</h3>
            <p className="text-blue-200 text-sm mb-4 opacity-80">Agrega hardware al catálogo.</p>
            <div className="bg-white text-primary font-black text-sm py-2 px-5 rounded-lg hover:bg-blue-50 transition-all shadow-md w-fit flex items-center gap-2">
              <span>+</span> Cargar Ahora
            </div>
          </div>
          <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🚀</div>
        </a>

        {/* Punto de Venta */}
        <a href="/admin/nueva-venta" className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all active:scale-95 group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-1">Punto de Venta</h3>
            <p className="text-emerald-200 text-sm mb-4 opacity-80">Registrar venta manual.</p>
            <div className="bg-white text-teal-800 font-black text-sm py-2 px-5 rounded-lg hover:bg-emerald-50 transition-all shadow-md w-fit flex items-center gap-2">
              <span>🏪</span> Ir al POS
            </div>
          </div>
          <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🧾</div>
        </a>

        {/* Marketing */}
        <a href="/admin/marcas" className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all active:scale-95 group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-1">Marketing</h3>
            <p className="text-purple-200 text-sm mb-4 opacity-80">Gestiona marcas y banners.</p>
            <div className="bg-white text-purple-900 font-black text-sm py-2 px-5 rounded-lg hover:bg-purple-50 transition-all shadow-md w-fit flex items-center gap-2">
              <span>★</span> Gestionar
            </div>
          </div>
          <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🏷️</div>
        </a>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary fallback={
      <div className="text-center p-12 bg-red-50 rounded-xl border border-red-200">
        <h2 className="text-red-700 font-bold mb-2">Error en el Dashboard</h2>
        <button onClick={() => window.location.reload()} className="underline">Recargar</button>
      </div>
    }>
      <DashboardContent />
    </ErrorBoundary>
  );
}