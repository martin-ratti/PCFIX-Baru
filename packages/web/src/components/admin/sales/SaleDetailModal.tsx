import React, { useState, useEffect, useRef } from 'react';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';

interface SaleDetailModalProps {
  isOpen: boolean;
  sale: any;
  autoFocusDispatch?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDispatch?: () => void;
}

export default function SaleDetailModal({ isOpen, sale, autoFocusDispatch, onClose, onApprove, onReject, onDispatch }: SaleDetailModalProps) {
  const [trackingCode, setTrackingCode] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const addToast = useToastStore(s => s.addToast);
  const { token } = useAuthStore();
  
  const trackingInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus solo si es ENVÍO y está aprobado
  useEffect(() => {
      if (isOpen && autoFocusDispatch && sale?.estado === 'APROBADO' && sale.tipoEntrega === 'ENVIO') {
          setTimeout(() => trackingInputRef.current?.focus(), 100);
      }
  }, [isOpen, autoFocusDispatch, sale]);

  if (!isOpen || !sale) return null;

  // Lógica de Despacho / Entrega
  const handleDispatch = async () => {
      // Si es Retiro, generamos un código automático. Si es Envío, requerimos el input.
      const codeToSend = sale.tipoEntrega === 'RETIRO' ? 'RETIRO_EN_TIENDA' : trackingCode;

      if (!codeToSend.trim()) {
          addToast('Ingresa el código de seguimiento', 'error');
          return;
      }

      setIsDispatching(true);
      try {
          const res = await fetch(`http://localhost:3002/api/sales/${sale.id}/dispatch`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ trackingCode: codeToSend })
          });
          
          const json = await res.json();
          
          if (json.success) {
              addToast(sale.tipoEntrega === 'RETIRO' ? 'Entrega confirmada' : 'Pedido despachado', 'success');
              if (onDispatch) onDispatch(); 
              onClose();
          } else {
              throw new Error(json.error);
          }
      } catch (e: any) {
          addToast(e.message || 'Error de conexión', 'error');
      } finally {
          setIsDispatching(false);
      }
  };

  // Helpers visuales para el método de pago
  const getPaymentStyle = (method: string) => {
      switch(method) {
          case 'BINANCE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'EFECTIVO': return 'bg-green-100 text-green-800 border-green-200';
          default: return 'bg-blue-50 text-blue-800 border-blue-100';
      }
  };

  const getPaymentIcon = (method: string) => {
      switch(method) {
          case 'BINANCE': return '🪙';
          case 'EFECTIVO': return '💵';
          default: return '🏦';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header con Badge de Entrega */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                Auditoría de Venta #{sale.id}
                
                {/* BADGE TIPO DE ENTREGA */}
                <span className={`text-xs px-2 py-0.5 rounded border uppercase tracking-wide ${
                    sale.tipoEntrega === 'RETIRO' 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                    {sale.tipoEntrega === 'RETIRO' ? '🏪 RETIRO EN LOCAL' : '🚚 ENVÍO A DOMICILIO'}
                </span>
            </h3>
            <p className="text-sm text-gray-500">{new Date(sale.fecha).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* --- COLUMNA IZQUIERDA: DATOS --- */}
            <div className="space-y-6">
                
                {/* TARJETA TOTAL Y PAGO */}
                <div className={`p-5 rounded-xl border ${getPaymentStyle(sale.medioPago)}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold uppercase mb-1 opacity-70">Total a Cobrar</p>
                            <p className="text-4xl font-black">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                            {Number(sale.costoEnvio) > 0 && (
                                <p className="text-xs mt-1 opacity-80">+ Envío: ${Number(sale.costoEnvio).toLocaleString('es-AR')}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-3xl block">{getPaymentIcon(sale.medioPago)}</span>
                            <span className="text-xs font-bold uppercase block mt-1">{sale.medioPago}</span>
                        </div>
                    </div>
                </div>

                {/* DATOS CLIENTE */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 uppercase text-xs tracking-wider">Datos del Cliente</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium text-gray-900">Nombre:</span> {sale.cliente?.user?.nombre} {sale.cliente?.user?.apellido}</p>
                        <p><span className="font-medium text-gray-900">Email:</span> {sale.cliente?.user?.email}</p>
                        
                        {sale.tipoEntrega === 'ENVIO' && (
                            <div className="mt-2 pt-2 border-t border-gray-50">
                                <p className="text-blue-600 font-medium">📦 Datos de Envío:</p>
                                <p>CP: {sale.cpDestino || 'No especificado'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PRODUCTOS */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                   <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 uppercase text-xs tracking-wider">
                       Productos ({sale.lineasVenta?.length || 0})
                   </h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                     {sale.lineasVenta && sale.lineasVenta.map((line: any) => (
                       <div key={line.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                         <div className="flex items-center gap-2">
                            <span className="font-bold bg-gray-100 text-gray-600 px-2 rounded text-xs">x{line.cantidad}</span>
                            <span className="text-gray-700 truncate max-w-[150px]" title={line.producto.nombre}>{line.producto.nombre}</span>
                         </div>
                         <span className="font-mono font-bold text-gray-500">${Number(line.subTotal).toLocaleString('es-AR')}</span>
                       </div>
                     ))}
                   </div>
                </div>
            </div>

            {/* --- COLUMNA DERECHA: COMPROBANTE --- */}
            <div className="flex flex-col h-full">
                <h4 className="font-bold text-gray-700 mb-3 flex justify-between items-center">
                    Comprobante
                </h4>
                <div className="bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden relative flex-grow min-h-[300px] border-4 border-white shadow-md group">
                    {sale.comprobante ? (
                        <>
                            <img src={sale.comprobante} alt="Comprobante" className="max-w-full max-h-full object-contain" />
                            <a href={sale.comprobante} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                Ver Original ↗
                            </a>
                        </>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center p-8 text-center">
                            {sale.medioPago === 'EFECTIVO' ? (
                                <>
                                    <span className="text-5xl mb-4">💵</span>
                                    <span className="font-bold text-gray-400">Pago Presencial</span>
                                    <span className="text-xs mt-2 text-gray-600">Se abona al retirar</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-5xl mb-4">📄</span>
                                    <span>Sin comprobante</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* --- SECCIÓN DE DESPACHO / ENTREGA (Solo si APROBADO) --- */}
          {sale.estado === 'APROBADO' && (
              <div className={`mt-8 p-6 border rounded-xl animate-in slide-in-from-bottom-2 ${sale.tipoEntrega === 'RETIRO' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                  
                  <h4 className={`font-bold mb-2 flex items-center gap-2 ${sale.tipoEntrega === 'RETIRO' ? 'text-green-800' : 'text-blue-800'}`}>
                      {sale.tipoEntrega === 'RETIRO' ? (
                          <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 1.138a3.001 3.001 0 014.125 0l.621.621h6.568l.621-.621a3.001 3.001 0 014.125 0l3.078 2.919a3.004 3.004 0 01-.621 4.72" /></svg> Finalizar Entrega</>
                      ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> Gestión de Despacho</>
                      )}
                  </h4>
                  
                  {sale.tipoEntrega === 'RETIRO' ? (
                      // UI RETIRO
                      <div className="flex justify-between items-center">
                          <p className="text-sm text-green-700">
                              El cliente retira en el local. Haz clic cuando entregues el producto.
                          </p>
                          <button 
                              onClick={handleDispatch}
                              disabled={isDispatching}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                          >
                              {isDispatching ? 'Procesando...' : 'Confirmar Entrega'}
                          </button>
                      </div>
                  ) : (
                      // UI ENVÍO
                      <div className="flex gap-3">
                          <input 
                              ref={trackingInputRef}
                              type="text" 
                              placeholder="Cód. Seguimiento (Ej: AA123...)" 
                              value={trackingCode}
                              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                              className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase bg-white"
                          />
                          <button 
                              onClick={handleDispatch}
                              disabled={isDispatching || !trackingCode}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                          >
                              {isDispatching ? 'Procesando...' : 'Confirmar Despacho'}
                          </button>
                      </div>
                  )}
              </div>
          )}
          
          {/* --- Info si ya está finalizado --- */}
          {(sale.estado === 'ENVIADO' || sale.estado === 'ENTREGADO') && (
              <div className="mt-8 p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-800 font-bold flex items-center justify-center gap-2">
                    ✅ {sale.tipoEntrega === 'RETIRO' ? 'Entregado en Local' : 'Pedido Despachado'}
                  </p>
                  {sale.codigoSeguimiento && sale.codigoSeguimiento !== 'RETIRO_EN_TIENDA' && (
                      <p className="text-gray-600 text-sm mt-1 font-mono">Tracking: {sale.codigoSeguimiento}</p>
                  )}
              </div>
          )}
        </div>

        {/* Footer: Acciones de Estado */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              sale.estado === 'APROBADO' ? 'bg-green-50 text-green-700 border-green-200' : 
              sale.estado === 'RECHAZADO' ? 'bg-red-50 text-red-700 border-red-200' : 
              sale.estado === 'ENVIADO' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
              Estado: {sale.estado}
          </span>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cerrar</button>
            
            {sale.estado === 'PENDIENTE_APROBACION' && (
                <>
                    <button onClick={onReject} className="px-5 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                        Rechazar
                    </button>
                    <button onClick={onApprove} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-colors hover:shadow-lg transform active:scale-95">
                        {sale.medioPago === 'EFECTIVO' ? 'Confirmar Pago Efectivo' : 'Confirmar Acreditación'}
                    </button>
                </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}