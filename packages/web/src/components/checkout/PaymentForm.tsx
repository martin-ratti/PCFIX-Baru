import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../stores/toastStore';

interface PaymentFormProps { saleId: number; }

export default function PaymentForm({ saleId }: PaymentFormProps) {
  const [sale, setSale] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Para mostrar la foto elegida
  
  const addToast = useToastStore(s => s.addToast);
  const { register, handleSubmit, watch } = useForm();
  const fileWatch = watch('comprobante');

  // Efecto para generar preview cuando selecciona archivo
  useEffect(() => {
    if (fileWatch && fileWatch.length > 0) {
        const file = fileWatch[0];
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url); // Limpieza de memoria
    } else {
        setPreviewUrl(null);
    }
  }, [fileWatch]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [saleRes, configRes] = await Promise.all([
                fetch(`http://localhost:3002/api/sales/${saleId}`),
                fetch(`http://localhost:3002/api/config`)
            ]);
            
            const sData = await saleRes.json();
            const cData = await configRes.json();
            
            if (sData.success) setSale(sData.data);
            if (cData.success) setConfig(cData.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };
    loadData();
  }, [saleId]);

  const onSubmit = async (data: any) => {
    if (!data.comprobante || data.comprobante.length === 0) {
        addToast("Debes seleccionar una imagen", 'error');
        return;
    }

    const formData = new FormData();
    formData.append('comprobante', data.comprobante[0]);

    try {
        const res = await fetch(`http://localhost:3002/api/sales/${saleId}/comprobante`, {
            method: 'POST',
            body: formData
        });
        const json = await res.json();
        if (json.success) {
            addToast("¡Comprobante enviado correctamente!", 'success');
            window.location.reload();
        } else throw new Error(json.error);
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  if (isLoading) return <div className="text-center p-10 animate-pulse">Cargando información del pedido...</div>;
  if (!sale) return <div className="text-center p-10 text-red-500">Pedido no encontrado.</div>;

  // ESTADO: YA PAGADO O EN REVISIÓN
  if (sale.estado !== 'PENDIENTE_PAGO') {
      return (
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-lg text-center border border-gray-100">
              <div className="mb-6 flex justify-center">
                  {sale.estado === 'PENDIENTE_APROBACION' && <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">⏳</div>}
                  {sale.estado === 'APROBADO' && <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">🎉</div>}
                  {sale.estado === 'RECHAZADO' && <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl">❌</div>}
              </div>
              <h2 className="text-3xl font-black text-secondary mb-4">
                  {sale.estado === 'PENDIENTE_APROBACION' && 'Comprobante Recibido'}
                  {sale.estado === 'APROBADO' && '¡Pago Aprobado!'}
                  {sale.estado === 'RECHAZADO' && 'Pago Rechazado'}
              </h2>
              
              {/* MOSTRAR LA FOTO QUE SUBIÓ */}
              {sale.comprobante && (
                  <div className="my-6 border rounded-lg overflow-hidden max-w-xs mx-auto">
                      <img src={sale.comprobante} alt="Tu comprobante" className="w-full h-auto opacity-80" />
                  </div>
              )}

              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {sale.estado === 'PENDIENTE_APROBACION' && 'Gracias por enviar tu comprobante. Nuestro equipo lo verificará a la brevedad y te confirmaremos el envío.'}
                  {sale.estado === 'APROBADO' && 'Hemos confirmado tu pago. Estamos preparando tu paquete para el envío.'}
                  {sale.estado === 'RECHAZADO' && 'Hubo un problema validando tu comprobante. Por favor contáctanos por WhatsApp.'}
              </p>
              
              <div className="flex justify-center gap-4">
                 <a href="/" className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Volver al Inicio</a>
                 <a href="/miscompras" className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors">Ver Mis Compras</a>
              </div>
          </div>
      );
  }

  // ESTADO: PENDIENTE DE PAGO
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Columna 1: Datos de Pago */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-secondary border-b pb-2 flex items-center gap-2">
                <span>1.</span> Realiza la Transferencia
            </h2>
            <div className="space-y-6">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-center">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1 tracking-wider">Total a Transferir</p>
                    <p className="text-4xl font-black text-blue-900">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                </div>

                <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex justify-between border-b border-gray-50 pb-2"><span>Banco:</span> <span className="font-bold text-gray-800">{config?.nombreBanco}</span></div>
                    <div className="flex justify-between border-b border-gray-50 pb-2"><span>Titular:</span> <span className="font-bold text-gray-800">{config?.titular}</span></div>
                    <div>
                        <span className="block mb-1">CBU:</span> 
                        <div className="flex gap-2">
                            <span className="font-mono bg-gray-100 p-2 rounded flex-grow select-all border border-gray-200">{config?.cbu}</span>
                        </div>
                    </div>
                    <div>
                        <span className="block mb-1">Alias:</span> 
                        <div className="flex gap-2">
                            <span className="font-mono bg-gray-100 p-2 rounded flex-grow select-all border border-gray-200 font-bold text-gray-800">{config?.alias}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Columna 2: Subir Comprobante */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-6 text-secondary border-b pb-2 flex items-center gap-2">
                <span>2.</span> Informar Pago
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Área de Dropzone Visual */}
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${previewUrl ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                    <input 
                        type="file" 
                        id="comprobante" 
                        accept="image/*,.pdf"
                        {...register('comprobante')} 
                        className="hidden" 
                    />
                    <label htmlFor="comprobante" className="cursor-pointer flex flex-col items-center gap-3 w-full h-full">
                        {previewUrl ? (
                            // Previsualización si ya eligió
                            <div className="relative w-full">
                                <img src={previewUrl} alt="Vista previa" className="max-h-48 mx-auto rounded-lg shadow-sm object-contain" />
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </span>
                                <p className="text-xs text-green-700 mt-2 font-bold">Archivo listo para subir</p>
                            </div>
                        ) : (
                            // Estado vacío
                            <>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                </div>
                                <div>
                                    <span className="text-primary font-bold">Haz clic para subir</span>
                                    <p className="text-xs text-gray-500 mt-1">Foto del comprobante o captura</p>
                                </div>
                            </>
                        )}
                    </label>
                </div>
                
                <button 
                    disabled={!previewUrl}
                    className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Confirmar y Enviar
                </button>
            </form>
        </div>
    </div>
  );
}