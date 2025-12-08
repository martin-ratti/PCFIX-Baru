import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client';
import { fetchApi } from '../../../utils/api';
import OrderTimeline, { type OrderStatus } from '../../ui/OrderTimeline';

export default function UserSales() {
  const { user, token } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && token) {

      fetchApi(`/sales/my-sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setSales(data.data);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user, token]);

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400">Cargando historial...</div>;

  if (sales.length === 0) return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2">Aún no has realizado compras</h3>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">
        Explora nuestro catálogo de hardware high-end y encuentra los componentes perfectos para tu setup.
      </p>

      <a
        href="/tienda/productos"
        className="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        Explorar Catálogo
      </a>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 border-b border-gray-100 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Orden #{sale.id}</span>
              <span className="text-gray-700 text-sm font-medium">{new Date(sale.fecha).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <StatusBadge status={sale.estado} />
              <p className="font-black text-lg text-primary mt-1">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 py-4 border-b border-gray-50">
            <OrderTimeline
              status={sale.estado as OrderStatus}
              trackingCode={sale.codigoSeguimiento}
              shippingMethod={sale.tipoEntrega}
            />
          </div>

          <div className="p-6 space-y-2">
            {sale.lineasVenta.map((line: any) => (
              <div key={line.id} className="flex justify-between text-sm py-1 border-b last:border-0 border-gray-50">
                <span className="text-gray-700 font-medium flex items-center">
                  <img src={line.producto.foto || '/images/placeholder.png'} alt="" className="w-8 h-8 rounded object-cover mr-3 bg-gray-100" />
                  <span className="text-gray-400 mr-2">x{line.cantidad}</span> {line.producto.nombre}
                </span>
                <span className="font-mono text-gray-500">${Number(line.subTotal).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3 p-4 bg-gray-50">

            {sale.estado === 'PENDIENTE_PAGO' && (
              <button
                onClick={() => navigate(`/checkout/${sale.id}`)}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm flex items-center gap-2"
              >
                Pagar Ahora &rarr;
              </button>
            )}

            {sale.estado === 'PENDIENTE_APROBACION' && (
              <span className="text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Verificando pago...
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'PENDIENTE_PAGO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'PENDIENTE_APROBACION': 'bg-blue-100 text-blue-800 border-blue-200',
    'APROBADO': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'ENVIADO': 'bg-purple-100 text-purple-800 border-purple-200',
    'ENTREGADO': 'bg-green-100 text-green-800 border-green-200',
    'RECHAZADO': 'bg-red-100 text-red-800 border-red-200',
    'CANCELADO': 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels: Record<string, string> = {
    'PENDIENTE_PAGO': 'Pendiente',
    'PENDIENTE_APROBACION': 'En Revisión',
    'APROBADO': 'Preparando',
    'ENVIADO': 'En Camino',
    'ENTREGADO': 'Entregado',
    'RECHAZADO': 'Rechazado',
    'CANCELADO': 'Cancelado',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}