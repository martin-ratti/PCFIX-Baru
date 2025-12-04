import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import SaleDetailModal from './SaleDetailModal';

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  // Nuevos estados de filtro para flujo de trabajo real
  const [filter, setFilter] = useState<'VERIFICATION' | 'TO_SHIP' | 'SHIPPED' | 'ALL'>('VERIFICATION');
  
  const addToast = useToastStore(s => s.addToast);
  const { token } = useAuthStore();

  // Estados Modales
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [actionSale, setActionSale] = useState<{id: number, approve: boolean} | null>(null);

  const fetchSales = () => {
    fetch('http://localhost:3002/api/sales', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            setSales(data.data);
            // Aplicamos filtro inicial
            setFilteredSales(filterData(data.data, filter));
        }
      });
  };

  useEffect(() => { fetchSales(); }, []);

  // Lógica de filtrado mejorada
  const filterData = (data: any[], status: string) => {
      switch (status) {
          case 'VERIFICATION':
              return data.filter((s: any) => s.estado === 'PENDIENTE_APROBACION' || s.estado === 'PENDIENTE_PAGO');
          case 'TO_SHIP':
              return data.filter((s: any) => s.estado === 'APROBADO'); // Listos para despachar
          case 'SHIPPED':
              return data.filter((s: any) => s.estado === 'ENVIADO' || s.estado === 'ENTREGADO');
          case 'ALL':
          default:
              return data;
      }
  };

  useEffect(() => { 
      setFilteredSales(filterData(sales, filter)); 
  }, [filter, sales]);

  const handleViewDetail = (sale: any) => {
    setSelectedSale(sale);
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
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ estado: actionSale.approve ? 'APROBADO' : 'RECHAZADO' })
          });
          const json = await res.json();
          if(json.success) {
              addToast(actionSale.approve ? 'Venta Aprobada. ¡Lista para despachar!' : 'Venta Rechazada', actionSale.approve ? 'success' : 'info');
              fetchSales();
          } else addToast('Error al actualizar', 'error');
      } catch(e) { addToast('Error de conexión', 'error'); }
      finally { setActionSale(null); }
  };

  // Callback para cuando se despacha desde el modal
  const onDispatchSuccess = () => {
      fetchSales();
      // Opcional: cambiar a pestaña de enviados automáticamente
      // setFilter('SHIPPED'); 
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Pestañas de Filtro Operativo */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2 overflow-x-auto">
        <button onClick={() => setFilter('VERIFICATION')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'VERIFICATION' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>
            Por Revisar <span className="ml-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-xs">{sales.filter(s => s.estado === 'PENDIENTE_APROBACION').length}</span>
        </button>
        
        <button onClick={() => setFilter('TO_SHIP')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'TO_SHIP' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>
            A Despachar <span className="ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs">{sales.filter(s => s.estado === 'APROBADO').length}</span>
        </button>

        <button onClick={() => setFilter('SHIPPED')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'SHIPPED' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>
            Enviados
        </button>
        
        <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${filter === 'ALL' ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:bg-gray-200'}`}>
            Todos
        </button>
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
                        {sale.estado === 'PENDIENTE_APROBACION' && '●'} {sale.estado.replace('_', ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                    <button 
                        onClick={() => handleViewDetail(sale)}
                        className={`font-bold border px-3 py-1.5 rounded-lg shadow-sm transition-all 
                           ${sale.estado === 'APROBADO' 
                             ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' // Destacar botón si hay que despachar
                             : 'bg-white text-primary border-gray-200 hover:bg-blue-50 hover:border-primary'}`}
                    >
                        {sale.estado === 'APROBADO' ? 'Despachar' : 'Ver Detalle'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle con lógica de despacho inyectada */}
      <SaleDetailModal 
        isOpen={!!selectedSale} 
        sale={selectedSale} 
        onClose={() => setSelectedSale(null)}
        onApprove={() => requestAction(selectedSale.id, true)}
        onReject={() => requestAction(selectedSale.id, false)}
        onDispatch={onDispatchSuccess}
      />

      <ConfirmModal 
        isOpen={!!actionSale}
        title={actionSale?.approve ? "Aprobar Venta" : "Rechazar Venta"}
        message={`¿Confirmas que deseas ${actionSale?.approve ? 'APROBAR' : 'RECHAZAR'} esta operación?`}
        confirmText={actionSale?.approve ? "Sí, Aprobar" : "Sí, Rechazar"}
        isDanger={!actionSale?.approve}
        onConfirm={executeAction}
        onCancel={() => setActionSale(null)}
      />
    </div>
  );
}