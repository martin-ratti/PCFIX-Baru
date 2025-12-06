import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client';
import { fetchApi } from '../../../utils/api'; // Usamos fetchApi para consistencia

export default function SalesChart() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const availableYears = [2024, 2025, 2026];

  useEffect(() => {
    if (token) {
        setLoading(true);
        // fetchApi maneja la URL base automáticamente
        fetchApi(`/sales/balance?year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(res => { if (res.success) setData(res.data); })
        .catch(err => console.error("Error chart:", err))
        .finally(() => setLoading(false));
    }
  }, [token, year]);

  const handleBarClick = (data: any) => {
      if (data && data.monthIndex) {
          navigate(`/admin/ventas?month=${data.monthIndex}&year=${year}`);
      }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

  const totalServices = data.reduce((acc: any, curr: any) => acc + curr.services, 0);
  const totalProducts = data.reduce((acc: any, curr: any) => acc + curr.products, 0);

  if (loading && data.length === 0) return <div className="h-[450px] w-full bg-gray-50 rounded-2xl animate-pulse"></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[450px] flex flex-col">
        
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Balance de Ingresos</h3>
                <div className="flex gap-4 mt-1 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Productos: <strong>{formatCurrency(totalProducts)}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Servicios: <strong>{formatCurrency(totalServices)}</strong>
                    </span>
                </div>
            </div>
            
            <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 outline-none font-bold"
            >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>

        {/* 👇 CONTENEDOR CON ALTURA EXPLÍCITA PARA EVITAR ERROR DE RECHARTS */}
        <div className="flex-1 w-full min-h-0 relative"> 
            <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12 }} 
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
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [formatCurrency(value)]}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        
                        <Bar 
                            dataKey="products" 
                            name="Productos" 
                            fill="#4f46e5" 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={50}
                            onClick={handleBarClick}
                            cursor="pointer"
                        />
                        
                        <Bar 
                            dataKey="services" 
                            name="Servicios" 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={50}
                            onClick={handleBarClick}
                            cursor="pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
}