import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number; // Mantenemos la interfaz aunque no lo mostremos, por compatibilidad con API
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
        // Fallback seguro
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
  
  // Cálculo visual de salud
  const stockHealth = safeStats.totalProducts > 0 
    ? Math.round(((safeStats.totalProducts - safeStats.lowStockProducts) / safeStats.totalProducts) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header con Salud del Inventario */}
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
            <div 
              className={`h-full transition-all duration-1000 ${stockHealth > 80 ? 'bg-green-500' : stockHealth > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
              style={{ width: `${stockHealth}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{stockHealth}% productos saludables</p>
        </div>
      </div>
      
      {/* Grid Métricas Principales (Ahora 3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Inventario Total */}
        <div 
          onClick={() => navigate('/admin/productos')} 
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
          <div className="relative z-10">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Inventario Total</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.totalProducts}</p>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-blue-100">
              Ver catálogo <span>&rarr;</span>
            </span>
          </div>
        </div>

        {/* 2. Stock Crítico */}
        <div 
          onClick={() => navigate('/admin/productos?filter=lowStock')} 
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 border-l-8 border-l-red-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">⚠️</div>
          <div className="relative z-10">
            <h3 className="text-red-600 font-bold text-xs uppercase tracking-wider mb-1">Atención Requerida</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.lowStockProducts}</p>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-red-100">
              {safeStats.lowStockProducts === 0 ? 'Todo ordenado' : 'Reponer ahora'} <span>&rarr;</span>
            </span>
          </div>
        </div>

        {/* 3. Ventas (Ocupa el lugar de usuarios) */}
        <div 
          onClick={() => navigate('/admin/ventas')} 
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
        >
           <div className="absolute -right-4 -top-4 text-9xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
          <div className="relative z-10">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1 group-hover:text-purple-600 transition-colors">Ventas Totales</h3>
            <p className="text-5xl font-black text-secondary mb-4">{safeStats.recentSales}</p>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 group-hover:bg-purple-100">
              Ver historial <span>&rarr;</span>
            </span>
          </div>
        </div>
      </div>      

      {/* Accesos Rápidos Inferiores (2 Columnas Grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Columna Izquierda: Crear Producto */}
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[200px]">
           <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-2">Nuevo Producto</h3>
             <p className="text-blue-100 mb-6 text-sm leading-relaxed max-w-md">Carga nuevos ítems al catálogo. Recuerda tener las imágenes listas para subir.</p>
             <button 
                onClick={(e) => { e.stopPropagation(); navigate('/admin/nuevo'); }}
                className="bg-white text-primary font-black text-sm py-3 px-6 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 w-fit"
             >
                <span>+</span> Cargar Ahora
             </button>
           </div>
           <div className="absolute -right-6 -bottom-16 opacity-10 text-[10rem] leading-none select-none pointer-events-none">🚀</div>
        </div>

        {/* Columna Derecha: Marketing (Marcas y Banners) */}
        <div 
            onClick={() => navigate('/admin/marcas')}
            className="bg-gradient-to-br from-purple-900 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[200px] cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
           <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-2">Marketing & Marcas</h3>
             <p className="text-purple-100 mb-6 text-sm leading-relaxed max-w-md">Gestiona las marcas oficiales y configura los banners publicitarios del Home.</p>
             <button className="bg-white text-purple-900 font-black text-sm py-3 px-6 rounded-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 w-fit">
                <span>★</span> Gestionar Banners
             </button>
           </div>
           <div className="absolute -right-6 -bottom-12 opacity-10 text-[10rem] leading-none select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">🏷️</div>
        </div>
      </div>
    </div>
  );
}