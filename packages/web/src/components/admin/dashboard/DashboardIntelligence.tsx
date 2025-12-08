import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchApi } from '../../../utils/api';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client';
import DiscountModal from '../products/DiscountModal';
import { useToastStore } from '../../../stores/toastStore';

interface IntelligenceData {
    kpis: {
        grossRevenue: number;
        lowStockProducts: number;
        inventoryValue: number;
        pendingSupport: number;
    };
    charts: {
        salesTrend: { date: string; count: number; total: number }[];
        topProducts: { name: string; quantity: number }[];
    };
    deadStock: {
        id: number;
        name: string;
        stock: number;
        price: number;
        lastSale: string | null;
        daysInactive: number;
    }[];
}

export default function DashboardIntelligence() {
    const { token } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const [data, setData] = useState<IntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [offerProduct, setOfferProduct] = useState<any>(null);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        fetchApi('/stats/intelligence', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res.data);
                else setError('Error al cargar datos');
            })
            .catch(err => {
                console.error(err);
                setError('Error de conexión');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const handleRevenueClick = () => {
        const now = new Date();
        navigate(`/admin/ventas?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
    };

    const handleLowStockClick = () => {
        navigate('/admin/productos?filter=lowStock');
    };

    const handleSupportClick = () => {
        navigate('/admin/soporte');
    };

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const date = data.activePayload[0].payload.date;
            if (date) navigate(`/admin/ventas?date=${date}`);
        }
    };

    const handleDiscountUpdate = async (newPrice: number, originalPrice: number | null) => {
        if (!offerProduct) return;
        try {
            await fetchApi(`/products/${offerProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ precio: newPrice, precioOriginal: originalPrice })
            });
            addToast('Oferta Flash aplicada', 'success');
        } catch (e) {
            addToast('Error al aplicar oferta', 'error');
            console.error(e);
        } finally {
            setOfferProduct(null);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">Analizando datos comerciales...</div>;
    if (error || !data) return <div className="p-12 text-center text-red-400">{error || 'No hay datos disponibles'}</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        Inteligencia de Ventas
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Centro de Comando Visual</p>
                </div>
            </div>

            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Ingresos Brutos */}
                <div
                    onClick={handleRevenueClick}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                >
                    <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">💰</div>
                    <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Ingresos (Mes)</h3>
                    <p className="text-4xl font-black text-primary mb-2 line-clamp-1" title={formatCurrency(data.kpis.grossRevenue)}>
                        {formatCurrency(data.kpis.grossRevenue)}
                    </p>
                    <p className="text-xs text-gray-400">Facturación bruta este mes (Clic para ver)</p>
                </div>

                {/* Bajo Stock */}
                <div
                    onClick={handleLowStockClick}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                >
                    <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">⚠️</div>
                    <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Bajo Stock</h3>
                    <p className="text-4xl font-black text-orange-500 mb-2 line-clamp-1">
                        {data.kpis.lowStockProducts}
                    </p>
                    <p className="text-xs text-gray-400">Productos con stock ≤ 5 (Clic para ver)</p>
                </div>

                {/* Valor Inventario */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">📦</div>
                    <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Valor Inventario</h3>
                    <p className={`font-black text-emerald-600 mb-2 line-clamp-1 ${data.kpis.inventoryValue > 10000000 ? 'text-2xl lg:text-3xl' : 'text-4xl'}`} title={formatCurrency(data.kpis.inventoryValue)}>
                        {formatCurrency(data.kpis.inventoryValue)}
                    </p>
                    <p className="text-xs text-gray-400">Capital en mercadería (PVP)</p>
                </div>

                {/* Soporte Técnico */}
                <div
                    onClick={handleSupportClick}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                >
                    <div className="absolute -right-4 -top-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none">🎧</div>
                    <h3 className="text-gray-500 font-bold text-xs uppercase mb-1">Soporte Técnico</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-black text-purple-600 mb-2">{data.kpis.pendingSupport}</p>
                    </div>
                    <p className="text-xs text-gray-400">Consultas pendientes (Clic para ver)</p>
                </div>
            </div>

            {/* 2. CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Evolución Ventas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Ventas (30 días)</h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <div className="absolute inset-0 cursor-pointer">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.charts.salesTrend} onClick={handleChartClick}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Productos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Productos (30 días)</h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <div className="absolute inset-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.topProducts} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. DEAD STOCK */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            💀 Stock Inmovilizado
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{data.deadStock.length}</span>
                        </h3>
                        <p className="text-sm text-gray-400">Productos sin ventas en +90 días. ¡Muévelos!</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <th className="p-4 font-semibold">Producto</th>
                                <th className="p-4 font-semibold text-center">Stock</th>
                                <th className="p-4 font-semibold text-right">Inactividad</th>
                                <th className="p-4 font-semibold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {data.deadStock.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">¡Excelente! No tienes stock muerto.</td>
                                </tr>
                            ) : (
                                data.deadStock.slice(0, 10).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-gray-700">{item.stock}</span>
                                        </td>
                                        <td className="p-4 text-right text-gray-500">{item.daysInactive} días</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setOfferProduct(item)} // OPEN EXISTING MODAL
                                                className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                ⚡ Oferta Flash
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DiscountModal
                isOpen={!!offerProduct}
                product={offerProduct ? {
                    id: offerProduct.id,
                    nombre: offerProduct.name,
                    precio: offerProduct.price.toString(),
                    precioOriginal: null
                } : null}
                onCancel={() => setOfferProduct(null)}
                onConfirm={handleDiscountUpdate}
            />
        </div>
    );
}
