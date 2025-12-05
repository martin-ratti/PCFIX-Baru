import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { useAuthStore } from "../../../stores/authStore";
import { fetchApi } from '../../../utils/api'; // 👇 API Utility
import SalesChart from './SalesChart';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  recentSales: number;
  pendingInquiries: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // Eliminamos 'error' state porque fetchApi maneja redirección en caso crítico

  useEffect(() => {
    // 👇 fetchApi simplificado
    fetchApi('/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
        // Si no es success pero tampoco 500, podríamos mostrar un toast
      })
      .catch(err => {
        console.error("Error loading stats:", err);
        // Fallback visual silencioso si falla algo no crítico
        setStats({ totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0, pendingInquiries: 0 });
      });
  }, []);

  if (!stats) return <div className="p-12 text-center text-gray-400 animate-pulse">Cargando panel de control...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            Panel de Control
          </h2>
          <p className="text-gray-500 text-sm mt-1">Bienvenido de nuevo, {user?.nombre || 'Administrador'}</p>
        </div>
      </div>
      
      {/* 2. GRID DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => navigate('/admin/productos')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Inventario</h3>
          <p className="text-4xl font-black text-secondary mb-2">{stats.totalProducts}</p>
          <span className="text-xs text-blue-600 font-bold">Ver catálogo &rarr;</span>
        </div>

        <div onClick={() => navigate('/admin/productos?filter=lowStock')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📉</div>
          <h3 className="text-red-600 font-bold text-xs uppercase mb-1">Atención</h3>
          <p className="text-4xl font-black text-secondary mb-2">{stats.lowStockProducts}</p>
          <span className="text-xs text-red-600 font-bold">{stats.lowStockProducts === 0 ? 'Ordenado' : 'Reponer'} &rarr;</span>
        </div>

        <div onClick={() => navigate('/admin/ventas')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Ventas</h3>
          <p className="text-4xl font-black text-secondary mb-2">{stats.recentSales}</p>
          <span className="text-xs text-purple-600 font-bold">Historial &rarr;</span>
        </div>

        <div onClick={() => navigate('/admin/soporte')} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${stats.pendingInquiries > 0 ? 'ring-2 ring-orange-400' : ''}`}>
           <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💬</div>
           <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Soporte Técnico</h3>
           <p className="text-4xl font-black text-secondary mb-2">{stats.pendingInquiries}</p>
           <span className={`text-xs font-bold ${stats.pendingInquiries > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {stats.pendingInquiries > 0 ? 'Consultas pendientes' : 'Al día'} &rarr;
           </span>
        </div>
      </div> 

      {/* 3. GRÁFICO DE BALANCE */}
      <div className="grid grid-cols-1">
          <SalesChart /> 
      </div>

      {/* 4. ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Nuevo Producto */}
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all group" onClick={() => navigate('/admin/nuevo')}>
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Nuevo Producto</h3>
             <p className="text-blue-200 text-sm mb-4 opacity-80">Agrega hardware al catálogo.</p>
             <button className="bg-white text-primary font-black text-sm py-2 px-5 rounded-lg hover:bg-blue-50 transition-all shadow-md w-fit flex items-center gap-2">
               <span>+</span> Cargar Ahora
             </button>
           </div>
           <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🚀</div>
        </div>

        {/* Punto de Venta */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all group" onClick={() => navigate('/admin/nueva-venta')}>
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Punto de Venta</h3>
             <p className="text-emerald-200 text-sm mb-4 opacity-80">Registrar venta manual.</p>
             <button className="bg-white text-teal-800 font-black text-sm py-2 px-5 rounded-lg hover:bg-emerald-50 transition-all shadow-md w-fit flex items-center gap-2">
               <span>🏪</span> Ir al POS
             </button>
           </div>
           <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🧾</div>
        </div>

        {/* Marketing */}
        <div onClick={() => navigate('/admin/marcas')} className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all group">
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Marketing</h3>
             <p className="text-purple-200 text-sm mb-4 opacity-80">Gestiona marcas y banners.</p>
             <button className="bg-white text-purple-900 font-black text-sm py-2 px-5 rounded-lg hover:bg-purple-50 transition-all shadow-md w-fit flex items-center gap-2">
               <span>★</span> Gestionar
             </button>
           </div>
           <div className="absolute -right-4 -bottom-6 opacity-10 text-8xl select-none group-hover:scale-110 transition-transform duration-500">🏷️</div>
        </div>
      </div>

    </div>
  );
}