import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import SaleDetailModal from './SaleDetailModal';
import { fetchApi } from '../../../utils/api'; // 👇 API Utility

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filter, setFilter] = useState<'VERIFICATION' | 'TO_SHIP' | 'SHIPPED' | 'ALL'>('VERIFICATION');
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  const addToast = useToastStore(s => s.addToast);
  const { token } = useAuthStore();

  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isDispatchMode, setIsDispatchMode] = useState(false);
  const [actionSale, setActionSale] = useState<{id: number, approve: boolean} | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('month');
      const y = params.get('year');
      if (m) setSelectedMonth(m);
      if (y) setSelectedYear(Number(y));
      if (m || y) setFilter('ALL');
  }, []);

  const fetchSales = () => {
    if (!token) return;
    
    // 👇 Uso de fetchApi (Url relativa)
    let url = '/sales?page=1';
    if (selectedMonth) url += `&month=${selectedMonth}`;
    if (selectedYear) url += `&year=${selectedYear}`;
    if (selectedPayment) url += `&paymentMethod=${selectedPayment}`;

    fetchApi(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setSales(data.data); })
      .catch(console.error);
  };

  useEffect(() => { if (token) fetchSales(); }, [token, selectedMonth, selectedYear, selectedPayment]);

  useEffect(() => { 
      const filterData = () => {
          let data = sales;
          if (selectedMonth || selectedPayment) return data; 

          switch (filter) {
              case 'VERIFICATION': return data.filter(s => s.estado === 'PENDIENTE_APROBACION' || s.estado === 'PENDIENTE_PAGO');
              case 'TO_SHIP': return data.filter(s => s.estado === 'APROBADO');
              case 'SHIPPED': return data.filter(s => s.estado === 'ENVIADO' || s.estado === 'ENTREGADO');
              default: return data;
          }
      };
      setFilteredSales(filterData()); 
  }, [filter, sales, selectedMonth, selectedPayment]);

  const handleOpenDetail = (sale: any, dispatchMode = false) => { setSelectedSale(sale); setIsDispatchMode(dispatchMode); };
  const requestAction = (id: number, approve: boolean) => { setSelectedSale(null); setActionSale({ id, approve }); };
  
  const executeAction = async () => {
      if (!actionSale) return;
      try {
          // 👇 Uso de fetchApi (PUT Status)
          const res = await fetchApi(`/sales/${actionSale.id}/status`, {
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
      
      {/* HEADER DE FILTROS */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {['VERIFICATION', 'TO_SHIP', 'SHIPPED', 'ALL'].map(f => (
                 <button key={f} onClick={() => {setFilter(f as any); setSelectedMonth(''); setSelectedPayment('');}} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === f && !selectedMonth && !selectedPayment ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>
                    {f === 'VERIFICATION' ? 'Por Revisar' : f === 'TO_SHIP' ? 'A Despachar' : f === 'SHIPPED' ? 'Enviados' : 'Todos'}
                 </button>
            ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center border-t border-gray-200 pt-4">
            <span className="text-xs font-bold text-gray-400 uppercase mr-2">Filtrar:</span>
            
            <select value={selectedPayment} onChange={(e) => { setSelectedPayment(e.target.value); setFilter('ALL'); }} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 outline-none focus:border-primary">
                <option value="">Método de Pago</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="BINANCE">Binance</option>
            </select>

            <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setFilter('ALL'); }} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 outline-none focus:border-primary">
                <option value="">Mes: Todos</option>
                {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i+1}>{new Date(0, i).toLocaleString('es-ES', {month: 'long'})}</option>
                ))}
            </select>

            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 outline-none font-bold">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
            </select>
            
            {(selectedMonth || selectedPayment) && (
                <button onClick={() => { setSelectedMonth(''); setSelectedPayment(''); }} className="text-red-500 text-xs font-bold hover:underline px-2">
                    Borrar Filtros
                </button>
            )}
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">#ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Pago</th>
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
                <td className="px-6 py-4 text-xs">
                    <span className={`px-2 py-1 rounded font-bold border ${sale.medioPago === 'BINANCE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : sale.medioPago === 'EFECTIVO' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {sale.medioPago}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm font-black text-primary">${Number(sale.montoTotal).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${sale.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : sale.estado === 'PENDIENTE_APROBACION' ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
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