import React, { useState, useEffect } from 'react';
import { useToastStore } from '../../stores/toastStore';
import ConfirmModal from '../shared/ConfirmModal';
import SaleDetailModal from './SaleDetailModal'; // Importar nuevo modal

export default function SalesListTable() {
  const [sales, setSales] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const addToast = useToastStore(s => s.addToast);

  // Estado para modales
  const [selectedSale, setSelectedSale] = useState<any>(null); // Para el detalle
  const [actionSale, setActionSale] = useState<{id: number, approve: boolean} | null>(null); // Para la confirmación

  const fetchSales = () => {
    fetch('http://localhost:3002/api/sales')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
            setSales(data.data);
            applyFilter(data.data, filter);
        }
      });
  };

  useEffect(() => { fetchSales(); }, []);

  const applyFilter = (data: any[], status: string) => {
      if (status === 'ALL') setFilteredSales(data);
      else if (status === 'PENDING') {
          setFilteredSales(data.filter((s: any) => s.estado === 'PENDIENTE_APROBACION' || s.estado === 'PENDIENTE_PAGO'));
      } else if (status === 'COMPLETED') {
          setFilteredSales(data.filter((s: any) => s.estado === 'APROBADO' || s.estado === 'RECHAZADO'));
      }
  };

  useEffect(() => { applyFilter(sales, filter); }, [filter, sales]);

  // 1. Abre el modal de detalle
  const handleViewDetail = (sale: any) => {
    setSelectedSale(sale);
  };

  // 2. Prepara la confirmación (se llama desde el Modal de Detalle o la Tabla)
  const requestAction = (id: number, approve: boolean) => {
    // Cerramos el detalle si estaba abierto para mostrar la confirmación limpia
    // (Opcional: podrías mostrar confirmación encima)
    setSelectedSale(null); 
    setActionSale({ id, approve });
  };

  // 3. Ejecuta la acción real
  const executeAction = async () => {
      if (!actionSale) return;
      try {
          const res = await fetch(`http://localhost:3002/api/sales/${actionSale.id}/status`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ estado: actionSale.approve ? 'APROBADO' : 'RECHAZADO' })
          });
          const json = await res.json();
          if(json.success) {
              addToast(actionSale.approve ? 'Venta Aprobada' : 'Venta Rechazada', actionSale.approve ? 'success' : 'info');
              fetchSales();
          } else {
              addToast('Error al actualizar estado', 'error');
          }
      } catch(e) { addToast('Error de conexión', 'error'); }
      finally { setActionSale(null); }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-4">
        <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${filter === 'PENDING' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Pendientes</button>
        <button onClick={() => setFilter('COMPLETED')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${filter === 'COMPLETED' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Historial</button>
        <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${filter === 'ALL' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Todas</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">#{sale.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.fecha).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{sale.cliente?.user?.nombre} {sale.cliente?.user?.apellido}</div>
                </td>
                <td className="px-6 py-4 text-sm font-black text-primary">${Number(sale.montoTotal).toLocaleString('es-AR')}</td>
                <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                        ${sale.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : 
                          sale.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' : 
                          sale.estado === 'PENDIENTE_APROBACION' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {sale.estado.replace('_', ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                    {/* BOTÓN DE DETALLE (Principal) */}
                    <button 
                        onClick={() => handleViewDetail(sale)}
                        className="text-blue-600 hover:text-blue-900 font-bold border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                    >
                        Ver Detalle
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle Completo */}
      <SaleDetailModal 
        isOpen={!!selectedSale} 
        sale={selectedSale} 
        onClose={() => setSelectedSale(null)}
        onApprove={() => requestAction(selectedSale.id, true)}
        onReject={() => requestAction(selectedSale.id, false)}
      />

      {/* Modal de Confirmación (Seguridad) */}
      <ConfirmModal 
        isOpen={!!actionSale}
        title={actionSale?.approve ? "Aprobar Venta" : "Rechazar Venta"}
        message={`¿Estás seguro de que deseas ${actionSale?.approve ? 'aprobar' : 'rechazar'} esta operación? Esta acción notificará al cliente.`}
        confirmText={actionSale?.approve ? "Sí, Aprobar" : "Sí, Rechazar"}
        isDanger={!actionSale?.approve}
        onConfirm={executeAction}
        onCancel={() => setActionSale(null)}
      />
    </div>
  );
}