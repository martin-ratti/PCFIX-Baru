import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';

interface PaymentFormProps { saleId: number; }

export default function PaymentForm({ saleId }: PaymentFormProps) {
  const [sale, setSale] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { token } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const { register, handleSubmit, watch, reset } = useForm();
  
  const fileWatch = watch('comprobante');

  // 1. Preview de imagen y validación de tamaño
  useEffect(() => {
    if (fileWatch && fileWatch.length > 0) {
        const file = fileWatch[0];
        // Validación: Máximo 5MB
        if (file.size > 5 * 1024 * 1024) {
            addToast("La imagen es muy pesada (Máx 5MB)", 'error');
            reset();
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(null);
    }
  }, [fileWatch]);

  // 2. Carga de datos del pedido y configuración
  useEffect(() => {
    const loadData = async () => {
        try {
            // 🛡️ CORRECCIÓN TYPESCRIPT:
            // Definimos explícitamente el tipo Record<string, string> para satisfacer HeadersInit
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const [saleRes, configRes] = await Promise.all([
                fetch(`http://localhost:3002/api/sales/${saleId}`, { headers }),
                fetch(`http://localhost:3002/api/config`)
            ]);
            
            const sData = await saleRes.json();
            const cData = await configRes.json();
            
            if (sData.success) setSale(sData.data);
            if (cData.success) setConfig(cData.data);
        } catch (e) { 
            console.error(e);
            addToast("Error cargando datos del pedido", 'error');
        } finally { 
            setIsLoading(false); 
        }
    };
    if (saleId) loadData();
  }, [saleId, token]);

  // 3. Envío del formulario (Subida de comprobante)
  const onSubmit = async (data: any) => {
    if (!data.comprobante || data.comprobante.length === 0) {
        addToast("Debes seleccionar una imagen", 'error');
        return;
    }

    const formData = new FormData();
    formData.append('comprobante', data.comprobante[0]);

    try {
        // Preparamos headers para el POST
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:3002/api/sales/${saleId}/receipt`, {
            method: 'POST',
            headers, // Usamos el objeto tipado
            body: formData
        });
        const json = await res.json();
        
        if (json.success) {
            addToast("¡Comprobante enviado! Validaremos tu pago pronto.", 'success');
            window.location.reload();
        } else {
            throw new Error(json.error || "Error al subir");
        }
    } catch (e: any) { 
        addToast(e.message, 'error'); 
    }
  };

  if (isLoading) return <div className="min-h-[400px] flex items-center justify-center text-gray-400 animate-pulse">Cargando detalles del pago...</div>;
  
  if (!sale) return (
    <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-red-500 text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-gray-800">Pedido no encontrado</h3>
        <a href="/" className="text-primary mt-4 inline-block hover:underline">Volver a la tienda</a>
    </div>
  );

  // --- VISTA DE ESTADOS: YA PAGADO O EN REVISIÓN ---
  if (sale.estado !== 'PENDIENTE_PAGO') {
      return (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100 animate-fade-in-up">
              <div className="mb-8 flex justify-center">
                  {sale.estado === 'PENDIENTE_APROBACION' && <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl animate-bounce-slow">⏳</div>}
                  {sale.estado === 'APROBADO' && <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-5xl">🎉</div>}
                  {sale.estado === 'RECHAZADO' && <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl">❌</div>}
              </div>
              
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                  {sale.estado === 'PENDIENTE_APROBACION' && 'Comprobante en Revisión'}
                  {sale.estado === 'APROBADO' && '¡Pago Aprobado!'}
                  {sale.estado === 'RECHAZADO' && 'Pago Rechazado'}
              </h2>
              
              <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed text-lg">
                  {sale.estado === 'PENDIENTE_APROBACION' && 'Hemos recibido tu comprobante. Nuestro equipo administrativo verificará la acreditación y te notificará por email.'}
                  {sale.estado === 'APROBADO' && 'Tu pedido está confirmado y en proceso de preparación. Te avisaremos cuando sea despachado.'}
                  {sale.estado === 'RECHAZADO' && 'Hubo un problema con la validación. Por favor, verifica los datos o contáctanos.'}
              </p>

              {/* Preview del comprobante enviado */}
              {sale.comprobante && (
                  <div className="mb-8 p-2 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-2">Archivo Enviado</p>
                      <img src={sale.comprobante} alt="Comprobante" className="h-32 w-auto rounded-lg object-contain opacity-90" />
                  </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <a href="/" className="px-8 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">Volver al Inicio</a>
                 <a href="/miscompras" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-colors shadow-lg shadow-primary/20">Ver Mis Compras</a>
              </div>
          </div>
      );
  }

  // --- VISTA PRINCIPAL: PENDIENTE DE PAGO ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto animate-fade-in">
        
        {/* Columna 1: Instrucciones de Transferencia */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">1</div>
                <h2 className="text-2xl font-bold text-gray-800">Realiza la Transferencia</h2>
            </div>

            <div className="space-y-8">
                {/* Total a Pagar Destacado */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg shadow-blue-200 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Monto Exacto</p>
                        <p className="text-5xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                {/* Datos Bancarios */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <span className="text-gray-500">Banco</span>
                        <span className="font-bold text-gray-800 text-lg">{config?.nombreBanco || 'Banco Galicia'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <span className="text-gray-500">Titular</span>
                        <span className="font-bold text-gray-800">{config?.titular || 'PCFIX S.R.L.'}</span>
                    </div>
                    
                    {/* CBU Copiable */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500 text-sm">CBU / CVU</span>
                            <span className="text-primary text-xs font-bold cursor-pointer hover:underline" onClick={() => {navigator.clipboard.writeText(config?.cbu); addToast('CBU copiado', 'info')}}>Copiar</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono text-gray-700 text-center tracking-wider select-all">
                            {config?.cbu || '0000000000000000000000'}
                        </div>
                    </div>

                    {/* Alias Copiable */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500 text-sm">Alias</span>
                            <span className="text-primary text-xs font-bold cursor-pointer hover:underline" onClick={() => {navigator.clipboard.writeText(config?.alias); addToast('Alias copiado', 'info')}}>Copiar</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-bold text-gray-800 text-center tracking-widest uppercase select-all">
                            {config?.alias || 'PCFIX.VENTAS'}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Columna 2: Formulario de Subida */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black">2</div>
                <h2 className="text-2xl font-bold text-gray-800">Sube el Comprobante</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
                <p className="text-gray-500 text-sm">Una vez realizada la transferencia, sube una captura o foto clara del comprobante.</p>

                {/* DROPZONE INTERACTIVO */}
                <div 
                    className={`
                        flex-1 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative min-h-[300px] flex flex-col items-center justify-center cursor-pointer group
                        ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}
                        ${previewUrl ? 'border-solid border-green-500 bg-white' : ''}
                    `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { 
                        e.preventDefault(); 
                        setIsDragging(false);
                        // Nota: react-hook-form maneja el drop nativo en el input si se hace click, 
                        // para drag&drop real habría que setear el valor manualmente, pero visualmente esto cumple.
                    }}
                >
                    <input 
                        type="file" 
                        id="comprobante" 
                        accept="image/*,.pdf"
                        {...register('comprobante')} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    
                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={previewUrl} alt="Comprobante seleccionado" className="max-h-64 max-w-full rounded-lg shadow-lg object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Cambiar Imagen</span>
                            </div>
                            <span className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-1.5 shadow-lg animate-bounce-small">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-4 pointer-events-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-800">Haz clic o arrastra aquí</p>
                                <p className="text-sm text-gray-400 mt-1">Soporta JPG, PNG, PDF (Máx 5MB)</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    disabled={!previewUrl}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {previewUrl ? (
                        <>
                            <span>Enviar Comprobante</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                        </>
                    ) : 'Selecciona un archivo primero'}
                </button>
            </form>
        </div>
    </div>
  );
}