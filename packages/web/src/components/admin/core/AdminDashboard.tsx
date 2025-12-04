import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  recentSales: number;
  pendingInquiries: number;
}

export default function AdminDashboard() {
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

  if (!stats && !error) return <div className="p-12 text-center text-gray-400">Cargando...</div>;

  const safeStats = stats || { totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0, pendingInquiries: 0 };
  const stockHealth = safeStats.totalProducts > 0 
    ? Math.round(((safeStats.totalProducts - safeStats.lowStockProducts) / safeStats.totalProducts) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-4 gap-4">
        <div>
          {/* CORRECCIÓN: Reducido a text-xl para que sea subtítulo del H1 principal */}
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-3">
            Resumen General
            {error && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium border border-red-200">Offline</span>}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Estado actual de tu tienda</p>
        </div>
        <div className="text-right w-full md:w-auto">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Salud del Inventario</p>
          <div className="w-full md:w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden relative">
            <div className={`h-full transition-all duration-1000 ${stockHealth > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${stockHealth}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{stockHealth}% productos saludables</p>
        </div>
      </div>
      
      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Inventario */}
        <div onClick={() => navigate('/admin/productos')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Inventario</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.totalProducts}</p>
          <span className="text-xs text-blue-600 font-bold">Ver catálogo &rarr;</span>
        </div>

        {/* 2. Stock Bajo (Emoji Agregado) */}
        <div onClick={() => navigate('/admin/productos?filter=lowStock')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📉</div>
          <h3 className="text-red-600 font-bold text-xs uppercase mb-1">Atención</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.lowStockProducts}</p>
          <span className="text-xs text-red-600 font-bold">{safeStats.lowStockProducts === 0 ? 'Ordenado' : 'Reponer'} &rarr;</span>
        </div>

        {/* 3. Ventas Totales (Emoji Agregado) */}
        <div onClick={() => navigate('/admin/ventas')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
          <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Ventas</h3>
          <p className="text-4xl font-black text-secondary mb-2">{safeStats.recentSales}</p>
          <span className="text-xs text-purple-600 font-bold">Historial &rarr;</span>
        </div>

        {/* 4. Soporte (Emoji Agregado) */}
        <div onClick={() => navigate('/admin/soporte')} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${safeStats.pendingInquiries > 0 ? 'ring-2 ring-orange-400' : ''}`}>
           <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💬</div>
           <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Soporte Técnico</h3>
           <p className="text-4xl font-black text-secondary mb-2">{safeStats.pendingInquiries}</p>
           <span className={`text-xs font-bold ${safeStats.pendingInquiries > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {safeStats.pendingInquiries > 0 ? 'Consultas pendientes' : 'Al día'} &rarr;
           </span>
        </div>

      </div>      

      {/* Accesos Rápidos Inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]">
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Nuevo Producto</h3>
             <button onClick={(e) => { e.stopPropagation(); navigate('/admin/nuevo'); }} className="bg-white text-primary font-black text-sm py-2 px-5 rounded-lg mt-4 hover:bg-blue-50 transition-all shadow-md w-fit">
                + Cargar Ahora
             </button>
           </div>
           <div className="absolute -right-6 -bottom-10 opacity-10 text-9xl select-none">🚀</div>
        </div>

        <div onClick={() => navigate('/admin/marcas')} className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px] cursor-pointer hover:shadow-xl transition-all">
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-1">Marketing & Marcas</h3>
             <button className="bg-white text-purple-900 font-black text-sm py-2 px-5 rounded-lg mt-4 hover:bg-purple-50 transition-all shadow-md w-fit">
                ★ Gestionar
             </button>
           </div>
           <div className="absolute -right-6 -bottom-8 opacity-10 text-9xl select-none">🏷️</div>
        </div>
      </div>
    </div>
  );
}