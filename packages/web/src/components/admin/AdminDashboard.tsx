import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  recentSales: number;
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
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      })
      .catch(err => {
        console.error("Dashboard Error:", err);
        setError("No se pudieron cargar las métricas.");
        setStats({ totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0 });
      });
  }, []);

  if (!stats && !error) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">Cargando centro de control...</p>
      </div>
    );
  }

  const safeStats = stats || { totalProducts: 0, lowStockProducts: 0, totalUsers: 0, recentSales: 0 };
  const stockHealth = safeStats.totalProducts > 0 ? Math.round(((safeStats.totalProducts - safeStats.lowStockProducts) / safeStats.totalProducts) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary flex items-center gap-3">
            Resumen General
            {error && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium border border-red-200">Offline</span>}
          </h2>
          <p className="text-muted mt-1 text-sm">Estado actual de tu tienda al {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right w-full md:w-auto">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Salud del Inventario</p>
          <div className="w-full md:w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden relative">
            <div className={`h-full transition-all duration-1000 ${stockHealth > 80 ? 'bg-green-500' : stockHealth > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${stockHealth}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{stockHealth}% productos saludables</p>
        </div>
      </div>
      
      {/* Grid Métricas (Igual que antes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => navigate('/admin/productos')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
          <div className="relative z-10">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1 group-hover:text-blue-600">Inventario</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.totalProducts}</p>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-blue-100">Ver catálogo <span>&rarr;</span></span>
          </div>
        </div>

        <div onClick={() => navigate('/admin/productos?filter=lowStock')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-l-red-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">⚠️</div>
          <div className="relative z-10">
            <h3 className="text-red-600 font-bold text-xs uppercase tracking-wider mb-1">Atención</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.lowStockProducts}</p>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-red-100">{safeStats.lowStockProducts === 0 ? 'Todo ordenado' : 'Reponer'} <span>&rarr;</span></span>
          </div>
        </div>

        <div onClick={() => navigate('/admin/usuarios')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">👥</div>
          <div className="relative z-10">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1 group-hover:text-green-600">Clientes</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.totalUsers}</p>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-green-100">Gestionar <span>&rarr;</span></span>
          </div>
        </div>

        <div onClick={() => navigate('/admin/ventas')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
          <div className="relative z-10">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1 group-hover:text-purple-600">Ventas</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.recentSales}</p>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-purple-100">Historial <span>&rarr;</span></span>
          </div>
        </div>
      </div>      

      {/* Accesos Rápidos Inferiores (ACTUALIZADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Columna Izquierda: Crear Producto */}
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-2">Nuevo Producto</h3>
             <p className="text-blue-100 mb-6 text-sm leading-relaxed">Carga nuevos ítems al catálogo. Recuerda tener las imágenes listas.</p>
             <button onClick={(e) => { e.stopPropagation(); navigate('/admin/nuevo'); }} className="bg-white text-primary font-black text-sm py-3 px-6 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 w-fit">
                <span>+</span> Cargar Ahora
             </button>
           </div>
           <div className="absolute -right-10 -bottom-20 opacity-10 text-[12rem] leading-none select-none pointer-events-none">🚀</div>
        </div>

        {/* Columna Central (NUEVO): Marcas y Banners */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-2">Marketing & Marcas</h3>
             <p className="text-purple-100 mb-6 text-sm leading-relaxed">Gestiona las marcas oficiales y los banners publicitarios del Home.</p>
             <button onClick={(e) => { e.stopPropagation(); navigate('/admin/marcas'); }} className="bg-white text-purple-900 font-black text-sm py-3 px-6 rounded-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 w-fit">
                <span>★</span> Gestionar Banners
             </button>
           </div>
           <div className="absolute -right-10 -bottom-16 opacity-10 text-[12rem] leading-none select-none pointer-events-none">🏷️</div>
        </div>

        {/* Columna Derecha: Estado del Sistema */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-center gap-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Estado del Sistema</h3>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-sm font-medium text-secondary">DB</span></div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">OK</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-sm font-medium text-secondary">API</span></div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">OK</span>
            </div>
            <div className="text-center mt-2"><span className="text-[10px] font-mono text-gray-300">PCFIX v1.0.0</span></div>
        </div>
      </div>
    </div>
  );
}