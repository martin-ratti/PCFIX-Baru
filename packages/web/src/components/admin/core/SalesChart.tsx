import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client'; // Para redirigir

export default function SalesChart() {
  const { token } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el año seleccionado
  const [year, setYear] = useState(new Date().getFullYear());
  const availableYears = [2024, 2025, 2026]; // Puedes generarlo dinámicamente

  useEffect(() => {
    if (token) {
        setLoading(true);
        fetch(`http://localhost:3002/api/sales/balance?year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) setData(res.data);
        })
        .catch(err => console.error("Error chart:", err))
        .finally(() => setLoading(false));
    }
  }, [token, year]); // Se recarga cuando cambia el año

  // Manejador de Click en Barra
  const handleBarClick = (data: any) => {
      if (data && data.monthIndex) {
          // Redirige a ventas filtrando por ese mes y el año actual del gráfico
          navigate(`/admin/ventas?month=${data.monthIndex}&year=${year}`);
      }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

  if (loading && data.length === 0) return <div className="h-[350px] w-full bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Cargando métricas...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col transition-all">
        
        {/* Header con Selector de Año */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Balance Anual</h3>
                <p className="text-sm text-gray-500">Haz clic en un mes para ver el detalle</p>
            </div>
            
            <div className="flex gap-4 items-center">
                <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 cursor-pointer outline-none font-bold"
                >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <div className="text-right bg-green-50 px-3 py-1 rounded-lg border border-green-100 hidden sm:block">
                    <span className="block text-[10px] text-green-600 uppercase font-bold tracking-wider">Total {year}</span>
                    <span className="text-lg font-black text-green-700">
                        {formatCurrency(data.reduce((acc: any, curr: any) => acc + curr.total, 0))}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                        dy={10}
                        tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    />
                    <Bar 
                        dataKey="total" 
                        radius={[6, 6, 0, 0]} 
                        barSize={40} 
                        onClick={handleBarClick} // 👈 EVENTO DE CLICK
                        cursor="pointer"
                    >
                        {data.map((entry: any, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.total > 0 ? '#4f46e5' : '#e0e7ff'} 
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}