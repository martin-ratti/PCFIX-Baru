import React, { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client'; // 1. Importamos navigate

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  recentSales: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-8 text-center animate-pulse text-gray-400">Cargando métricas...</div>;

  // 2. Definimos un estilo base para las tarjetas interactivas
  const cardClass = "bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer duration-300 group";

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-secondary">Resumen General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Productos -> Inventario */}
        <div 
          onClick={() => navigate('/admin/productos')} 
          className={cardClass}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 text-sm font-medium group-hover:text-primary transition-colors">Productos Totales</h3>
            <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">📦</span>
          </div>
          <p className="text-3xl font-black text-secondary">{stats.totalProducts}</p>
        </div>

        {/* 2. Stock Crítico -> Inventario filtrado */}
        <div 
          onClick={() => navigate('/admin/productos?filter=lowStock')} 
          className={`${cardClass} border-l-4 border-l-red-500`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-red-600 text-sm font-bold">Stock Crítico</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-secondary">{stats.lowStockProducts}</p>
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Ver lista &rarr;</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Menos de 5 unidades</p>
        </div>

        {/* 3. Usuarios -> Lista de Usuarios */}
        <div 
          onClick={() => navigate('/admin/usuarios')} 
          className={cardClass}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 text-sm font-medium group-hover:text-green-600 transition-colors">Usuarios</h3>
            <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">👥</span>
          </div>
          <p className="text-3xl font-black text-secondary">{stats.totalUsers}</p>
        </div>

        {/* 4. Ventas -> Historial de Ventas */}
        <div 
          onClick={() => navigate('/admin/ventas')} 
          className={cardClass}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 text-sm font-medium group-hover:text-purple-600 transition-colors">Ventas</h3>
            <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">💰</span>
          </div>
          <p className="text-3xl font-black text-secondary">{stats.recentSales}</p>
        </div>
      </div>      
    </div>
  );
}