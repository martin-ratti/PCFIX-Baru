import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { useAuthStore } from "../../../stores/authStore";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then(data => {
        if (data.success) setStats(data.data);
        else throw new Error(data.error);
      })
      .catch(err => {
        console.error(err);
        setStats({ totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0, pendingInquiries: 0 });
      });
  }, []);

  if (!stats && !error) return <div className="p-12 text-center text-gray-400 animate-pulse">Cargando panel de control...</div>;

  const safeStats = stats || { totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0, pendingInquiries: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. Header Simplificado */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            Panel de Control
            {error && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium border border-red-200">Offline</span>}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Bienvenido de nuevo, {user?.nombre || 'Administrador'}</p>
        </div>
        {/* Eliminado el widget de Salud de Inventario */}
      </div>
      
      {/* 2. GRID DE KPIs (Métricas Clave) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Inventario */}
        <div onClick={() => navigate('/admin/productos')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Inventario</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.totalProducts}</p>
          <span className="text-xs text-blue-600 font-bold">Ver catálogo &rarr;</span>
        </div>

        {/* KPI: Stock Bajo */}
        <div onClick={() => navigate('/admin/productos?filter=lowStock')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📉</div>
          <h3 className="text-red-600 font-bold text-xs uppercase mb-1">Atención</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.lowStockProducts}</p>
          <span className="text-xs text-red-600 font-bold">{safeStats.lowStockProducts === 0 ? 'Ordenado' : 'Reponer'} &rarr;</span>
        </div>

        {/* KPI: Ventas Totales */}
        <div onClick={() => navigate('/admin/ventas')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Ventas</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.recentSales}</p>
          <span className="text-xs text-purple-600 font-bold">Historial &rarr;</span>
        </div>

        {/* KPI: Soporte Técnico */}
        <div onClick={() => navigate('/admin/soporte')} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${safeStats.pendingInquiries > 0 ? 'ring-2 ring-orange-400' : ''}`}>
           <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💬</div>
           <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Soporte Técnico</h3>
           <p className="text-4xl font-black text-secondary mb-2">{safeStats.pendingInquiries}</p>
           <span className={`text-xs font-bold ${safeStats.pendingInquiries > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {safeStats.pendingInquiries > 0 ? 'Consultas pendientes' : 'Al día'} &rarr;
           </span>
        </div>
      </div> 

      {/* 3. GRÁFICO DE BALANCE */}
      <div className="grid grid-cols-1">
          <SalesChart /> 
      </div>

      {/* 4. ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nuevo Producto */}
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] group cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/admin/nuevo')}>
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Nuevo Producto</h3>
             <p className="text-blue-200 text-sm mb-4 opacity-80">Agrega hardware al catálogo.</p>
             <button className="bg-white text-primary font-black text-sm py-2 px-5 rounded-lg hover:bg-blue-50 transition-all shadow-md w-fit flex items-center gap-2">
               <span>+</span> Cargar Ahora
             </button>
           </div>
           <div className="absolute -right-6 -bottom-10 opacity-10 text-9xl select-none group-hover:scale-110 transition-transform duration-500">🚀</div>
        </div>

        {/* Marketing */}
        <div onClick={() => navigate('/admin/marcas')} className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all group">
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Marketing & Marcas</h3>
             <p className="text-purple-200 text-sm mb-4 opacity-80">Gestiona logos y banners.</p>
             <button className="bg-white text-purple-900 font-black text-sm py-2 px-5 rounded-lg hover:bg-purple-50 transition-all shadow-md w-fit flex items-center gap-2">
               <span>★</span> Gestionar
             </button>
           </div>
           <div className="absolute -right-6 -bottom-8 opacity-10 text-9xl select-none group-hover:scale-110 transition-transform duration-500">🏷️</div>
        </div>
      </div>

    </div>
  );
}