import React from 'react';

interface SaleDetailModalProps {
  isOpen: boolean;
  sale: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function SaleDetailModal({ isOpen, sale, onClose, onApprove, onReject }: SaleDetailModalProps) {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-secondary">Auditoría de Venta #{sale.id}</h3>
            <p className="text-sm text-gray-500">{new Date(sale.fecha).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* Columna Izquierda: Datos y Productos */}
            <div className="space-y-6 flex flex-col h-full">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 font-bold uppercase mb-1">Total a Cobrar</p>
                    <p className="text-4xl font-black text-blue-900">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3 text-sm uppercase">Cliente</h4>
                    <p className="text-sm"><strong>Nombre:</strong> {sale.cliente?.user?.nombre} {sale.cliente?.user?.apellido}</p>
                    <p className="text-sm"><strong>Email:</strong> {sale.cliente?.user?.email}</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[200px] pr-2">
                   <h4 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3 text-sm uppercase sticky top-0 bg-white">Productos ({sale.lineasVenta?.length || 0})</h4>
                   
                   {/* LISTA DE PRODUCTOS */}
                   <div className="space-y-3">
                     {sale.lineasVenta && sale.lineasVenta.map((line: any) => (
                       <div key={line.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                         <div>
                           <span className="font-bold text-gray-800">{line.cantidad}x</span> {line.producto.nombre}
                         </div>
                         <span className="font-mono text-gray-600">${Number(line.subTotal).toLocaleString('es-AR')}</span>
                       </div>
                     ))}
                   </div>
                </div>
            </div>

            {/* Columna Derecha: Comprobante */}
            <div className="bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden relative min-h-[300px] group border border-gray-700">
                {sale.comprobante ? (
                    <>
                        <img 
                            src={sale.comprobante} 
                            alt="Comprobante" 
                            className="max-w-full max-h-full object-contain" 
                        />
                        <a 
                            href={sale.comprobante} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Abrir Original ↗
                        </a>
                    </>
                ) : (
                    <div className="text-gray-500 flex flex-col items-center">
                        <span className="text-4xl mb-2">📄</span>
                        <span>Sin comprobante adjunto</span>
                    </div>
                )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">
            Cerrar
          </button>
          
          {sale.estado === 'PENDIENTE_APROBACION' && (
              <>
                <button onClick={onReject} className="px-6 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 border border-red-200 transition-colors">
                    Rechazar
                </button>
                <button onClick={onApprove} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-colors">
                    Confirmar Acreditación
                </button>
              </>
          )}
        </div>

      </div>
    </div>
  );
}