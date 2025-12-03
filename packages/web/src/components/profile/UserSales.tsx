import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

export default function UserSales() {
  const { user, token } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si no hay usuario aún, esperamos (estado de carga inicial)
    if (!user) return;

    if (user?.id && token) {
      // OPTIMIZACIÓN: Pedimos solo las últimas 20 ventas para que sea rápido
      fetch(`http://localhost:3002/api/sales/my-sales?userId=${user.id}&limit=20`, {
         headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setSales(data.data);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, token]);

  // --- SKELETON LOADING ---
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
         {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 border border-gray-200 rounded-lg p-6 h-32"></div>
         ))}
      </div>
    );
  }
  // -----------------------

  if (sales.length === 0) return (
    <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500 mb-4">Aún no has realizado compras.</p>
      <a href="/productos" className="text-primary font-bold hover:underline">Ir al catálogo</a>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
            <div>
              <span className="text-xs text-gray-500 uppercase font-bold">Orden #{sale.id}</span>
              <p className="text-gray-700 text-sm">{new Date(sale.fecha).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
               <StatusBadge status={sale.estado} />
               <p className="font-black text-lg text-primary mt-1">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
             {sale.lineasVenta.map((line: any) => (
                <div key={line.id} className="flex justify-between text-sm">
                   <span className="text-gray-700">{line.cantidad}x {line.producto.nombre}</span>
                   <span className="font-mono text-gray-500">${Number(line.subTotal).toLocaleString('es-AR')}</span>
                </div>
             ))}
          </div>

          <div className="flex justify-end pt-2">
             {sale.estado === 'PENDIENTE_PAGO' && (
                <button 
                  onClick={() => navigate(`/checkout/${sale.id}`)}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
                >
                  Pagar Ahora
                </button>
             )}
             {sale.estado === 'PENDIENTE_APROBACION' && (
                <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 font-medium">
                   Verificando Pago...
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
        'PENDIENTE_PAGO': 'bg-yellow-100 text-yellow-800',
        'PENDIENTE_APROBACION': 'bg-blue-100 text-blue-800',
        'APROBADO': 'bg-green-100 text-green-800',
        'RECHAZADO': 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
        'PENDIENTE_PAGO': 'Pendiente de Pago',
        'PENDIENTE_APROBACION': 'Verificando',
        'APROBADO': 'Completado',
        'RECHAZADO': 'Rechazado',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
}