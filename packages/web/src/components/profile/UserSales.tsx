import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { navigate } from 'astro:transitions/client';

export default function UserSales() {
  const { user, token } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && token) {
      // Fetch con Token seguro
      fetch(`http://localhost:3002/api/sales/my-sales`, {
         headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setSales(data.data);
        })
        .finally(() => setIsLoading(false));
    } else {
        // Si no hay token, terminamos carga (guard se encargará de redirigir si aplica)
        setIsLoading(false);
    }
  }, [user, token]);

  if (isLoading) return <div className="p-12 text-center animate-pulse text-gray-400">Cargando historial...</div>;

  if (sales.length === 0) return (
    <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-gray-500 mb-4">Aún no has realizado compras.</p>
      <a href="/productos" className="text-primary font-bold hover:underline">Ir al catálogo</a>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {sales.map((sale) => (
        <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          
          {/* Header Tarjeta */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Orden #{sale.id}</span>
              <p className="text-gray-700 text-sm font-medium">{new Date(sale.fecha).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
               <StatusBadge status={sale.estado} />
               <p className="font-black text-lg text-primary mt-1">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="space-y-2 mb-6">
             {sale.lineasVenta.map((line: any) => (
                <div key={line.id} className="flex justify-between text-sm py-1">
                   <span className="text-gray-700 font-medium"><span className="text-gray-400 mr-2">x{line.cantidad}</span> {line.producto.nombre}</span>
                   <span className="font-mono text-gray-500">${Number(line.subTotal).toLocaleString('es-AR')}</span>
                </div>
             ))}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-50 pt-4">
             
             {/* Pagar */}
             {sale.estado === 'PENDIENTE_PAGO' && (
                <button 
                  onClick={() => navigate(`/checkout/${sale.id}`)}
                  className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm flex items-center gap-2"
                >
                  Pagar Ahora &rarr;
                </button>
             )}
             
             {/* Verificando */}
             {sale.estado === 'PENDIENTE_APROBACION' && (
                <span className="text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 font-medium flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                   Verificando pago...
                </span>
             )}

             {/* Tracking (Enviado) */}
             {sale.estado === 'ENVIADO' && sale.codigoSeguimiento && (
                <a 
                    href={`https://www.correoargentino.com.ar/formularios/e-commerce?id=${sale.codigoSeguimiento}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white border border-blue-200 text-blue-600 text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    Seguir Envío
                </a>
             )}

              {/* Finalizado */}
              {sale.estado === 'ENTREGADO' && (
                 <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                     Entregado
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