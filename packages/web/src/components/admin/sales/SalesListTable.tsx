import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import SaleDetailModal from './SaleDetailModal';

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filter, setFilter] = useState<'VERIFICATION' | 'TO_SHIP' | 'SHIPPED' | 'ALL'>('VERIFICATION');
  
  // Filtros de fecha
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const addToast = useToastStore(s => s.addToast);
  const { token } = useAuthStore();

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDispatchMode, setIsDispatchMode] = useState(false);
  const [actionSale, setActionSale] = useState<{id: number, approve: boolean} | null>(null);

  // Leer URL params al montar (navegación desde gráfico)
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('month');
      const y = params.get('year');
      if (m) setSelectedMonth(m);
      if (y) setSelectedYear(Number(y));
      if (m || y) setFilter('ALL'); // Forzar vista 'Todos' si hay filtro de fecha
  }, []);

  const fetchSales = () => {
    if (!token) return;
    
    // Construir Query
    let url = 'http://localhost:3002/api/sales?page=1';
    if (selectedMonth) url += `&month=${selectedMonth}`;
    if (selectedYear) url += `&year=${selectedYear}`;

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSales(data.data);
      })
      .catch(console.error);
  };

  useEffect(() => { 
      if (token) fetchSales(); 
  }, [token, selectedMonth, selectedYear]); // Recarga si cambian filtros

  // Filtrado local
  useEffect(() => { 
      const filterData = () => {
          let data = sales;
          // Si hay filtro de fecha, ignoramos las pestañas, o aplicamos sobre el resultado
          if (selectedMonth) return data; 

          switch (filter) {
              case 'VERIFICATION': return data.filter(s => s.estado === 'PENDIENTE_APROBACION' || s.estado === 'PENDIENTE_PAGO');
              case 'TO_SHIP': return data.filter(s => s.estado === 'APROBADO');
              case 'SHIPPED': return data.filter(s => s.estado === 'ENVIADO' || s.estado === 'ENTREGADO');
              default: return data;
          }
      };
      setFilteredSales(filterData()); 
  }, [filter, sales, selectedMonth]);

  const handleOpenDetail = (sale: any, dispatchMode = false) => {
    setSelectedSale(sale);
    setIsDispatchMode(dispatchMode);
  };

  const requestAction = (id: number, approve: boolean) => {
    setSelectedSale(null); 
    setActionSale({ id, approve }); 
  };

  const executeAction = async () => {
      if (!actionSale) return;
      try {
          const res = await fetch(`http://localhost:3002/api/sales/${actionSale.id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: actionSale.approve ? 'APROBADO' : 'RECHAZADO' })
          });
          const json = await res.json();
          if(json.success) {
              addToast(actionSale.approve ? 'Venta Aprobada' : 'Venta Rechazada', actionSale.approve ? 'success' : 'info');
              fetchSales();
          } else throw new Error(json.error);
      } catch(e: any) { addToast(e.message || 'Error', 'error'); }
      finally { setActionSale(null); }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in">
      {/* Header con Filtros */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
        
        {/* Pestañas (Se ocultan o deshabilitan si hay filtro de fecha activo para evitar confusión, opcional) */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button onClick={() => {setFilter('VERIFICATION'); setSelectedMonth('')}} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'VERIFICATION' && !selectedMonth ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>Por Revisar</button>
            <button onClick={() => {setFilter('TO_SHIP'); setSelectedMonth('')}} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'TO_SHIP' && !selectedMonth ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>A Despachar</button>
            <button onClick={() => {setFilter('SHIPPED'); setSelectedMonth('')}} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'SHIPPED' && !selectedMonth ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>Enviados</button>
            <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'ALL' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>Todos</button>
        </div>

        {/* Selectores de Fecha */}
        <div className="flex gap-2 items-center">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 outline-none">
                <option value="">Mes: Todos</option>
                {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i+1}>{new Date(0, i).toLocaleString('es-ES', {month: 'long'})}</option>
                ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2 outline-none font-bold">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
            </select>
            {selectedMonth && <button onClick={() => setSelectedMonth('')} className="text-red-500 text-xs font-bold hover:underline px-2">Borrar</button>}
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">#ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">#{sale.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.fecha).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium">{sale.cliente?.user?.nombre} {sale.cliente?.user?.apellido}</div>
                    <div className="text-xs text-gray-400">{sale.cliente?.user?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm font-black text-primary">${Number(sale.montoTotal).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                        ${sale.estado === 'APROBADO' ? 'bg-green-100 text-green-800 border border-green-200' : 
                          sale.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800 border border-red-200' : 
                          sale.estado === 'PENDIENTE_APROBACION' ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse' : 
                          sale.estado === 'ENVIADO' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                        {sale.estado.replace('_', ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => handleOpenDetail(sale, sale.estado === 'APROBADO')} className={`font-bold border px-3 py-1.5 rounded-lg shadow-sm transition-all ${sale.estado === 'APROBADO' ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' : 'bg-white text-primary border-gray-200 hover:bg-blue-50'}`}>
                        {sale.estado === 'APROBADO' ? 'Despachar' : 'Ver'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron ventas</div>}
      </div>

      <SaleDetailModal 
        isOpen={!!selectedSale} 
        sale={selectedSale} 
        autoFocusDispatch={isDispatchMode}
        onClose={() => setSelectedSale(null)}
        onApprove={() => requestAction(selectedSale.id, true)}
        onReject={() => requestAction(selectedSale.id, false)}
        onDispatch={() => fetchSales()}
      />

      <ConfirmModal 
        isOpen={!!actionSale}
        title={actionSale?.approve ? "Aprobar" : "Rechazar"}
        message="¿Confirmas esta acción?"
        confirmText="Confirmar"
        isDanger={!actionSale?.approve}
        onConfirm={executeAction}
        onCancel={() => setActionSale(null)}
      />
    </div>
  );
}