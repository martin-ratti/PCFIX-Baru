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

  // 1. Preview
  useEffect(() => {
    if (fileWatch && fileWatch.length > 0) {
        const file = fileWatch[0];
        if (file.size > 5 * 1024 * 1024) {
            addToast("La imagen es muy pesada (Máx 5MB)", 'error');
            reset();
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    } else { setPreviewUrl(null); }
  }, [fileWatch]);

  // 2. Carga de Datos
  useEffect(() => {
    const loadData = async () => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const [saleRes, configRes] = await Promise.all([
                fetch(`http://localhost:3002/api/sales/${saleId}`, { headers }),
                fetch(`http://localhost:3002/api/config`)
            ]);
            
            const sData = await saleRes.json();
            const cData = await configRes.json();
            
            if (sData.success) setSale(sData.data);
            if (cData.success) setConfig(cData.data);
        } catch (e) { console.error(e); addToast("Error cargando datos", 'error'); } 
        finally { setIsLoading(false); }
    };
    if (saleId) loadData();
  }, [saleId, token]);

  const onSubmit = async (data: any) => {
    // 👇 LOGICA DE EXCEPCIÓN: Si es Efectivo, no requerimos comprobante obligatorio.
    const isFileRequired = sale?.medioPago !== 'EFECTIVO';
    
    if (isFileRequired && (!data.comprobante || data.comprobante.length === 0)) {
        addToast("Debes seleccionar una imagen para confirmar tu pago", 'error');
        return;
    }

    const formData = new FormData();
    
    // Solo enviamos el archivo si existe (siempre se permite enviar, incluso si no es obligatorio)
    if (data.comprobante && data.comprobante.length > 0) {
        formData.append('comprobante', data.comprobante[0]);
    } else if (isFileRequired) {
        // Ya validamos esto arriba, pero es una doble capa de seguridad
        return;
    }
    
    try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // La ruta de backend es la misma, solo que ahora el body puede estar vacío de archivo
        const res = await fetch(`http://localhost:3002/api/sales/${saleId}/receipt`, {
            method: 'POST',
            headers,
            body: formData
        });
        const json = await res.json();
        
        if (json.success) {
            addToast(sale.medioPago === 'EFECTIVO' ? "Retiro confirmado y registrado" : "¡Comprobante enviado!", 'success');
            window.location.reload();
        } else {
            throw new Error(json.error || "Error al subir");
        }
    } catch (e: any) { 
        addToast(e.message, 'error'); 
    }
  };

  // 3. RENDERIZADO DE DATOS DE PAGO
  const renderPaymentInfo = () => {
      if (!sale || !config) return null;

      // --- CASO BINANCE ---
      if (sale.medioPago === 'BINANCE') {
          return (
            <div className="space-y-6 animate-fade-in">
                 <div className="bg-yellow-400 p-6 rounded-2xl text-black shadow-lg text-center relative overflow-hidden">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Monto USDT (Estimado)</p>
                    <p className="text-5xl font-black tracking-tight">{(Number(sale.montoTotal) / 1150).toFixed(2)} USDT</p>
                    <p className="text-xs mt-2 opacity-75">Total ARS: ${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                 </div>
                 <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Binance Pay ID / Email</p>
                        <div className="flex justify-between items-center">
                             <p className="text-lg font-mono font-bold text-gray-800 select-all">{config.binanceCbu || 'N/A'}</p>
                             <button onClick={() => navigator.clipboard.writeText(config.binanceCbu)} className="text-primary text-xs font-bold hover:underline">Copiar</button>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Alias de Cuenta</p>
                        <p className="text-lg font-bold text-gray-800 select-all">{config.binanceAlias || 'N/A'}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 border border-yellow-100 flex gap-2">
                        <span>⚠️</span>
                        <span>Realiza el envío a través de Binance Pay y sube la captura de la transacción exitosa.</span>
                    </div>
                 </div>
            </div>
          );
      }

      // --- CASO EFECTIVO (RETIRO EN LOCAL) ---
      if (sale.medioPago === 'EFECTIVO') {
          return (
            <div className="space-y-8 animate-fade-in text-center">
                 <div className="bg-green-600 p-6 rounded-2xl text-white shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total a Pagar en Local</p>
                    <p className="text-5xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                 </div>
                 <div className="space-y-2">
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-left">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-2">📍 Dirección de Retiro</p>
                        <p className="text-lg font-bold text-gray-900 mb-1">{config.direccionLocal}</p>
                        <p className="text-sm text-gray-600">{config.horariosLocal}</p>
                    </div>
                 </div>
                 <p className="text-sm text-gray-500 leading-relaxed">
                    Acércate a nuestro local con tu número de orden <strong>#{sale.id}</strong> para abonar y retirar tu producto.
                 </p>
            </div>
          );
      }

      // --- CASO TRANSFERENCIA (DEFAULT) ---
      return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg shadow-blue-200 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Monto Exacto</p>
                    <p className="text-5xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                </div>
            </div>
            <div className="space-y-5">
                <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500">Banco</span><span className="font-bold text-gray-800">{config.nombreBanco}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500">CBU</span><span className="font-mono font-bold text-gray-800 select-all">{config.cbu}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500">Alias</span><span className="font-bold text-gray-800 select-all">{config.alias}</span>
                </div>
            </div>
        </div>
      );
  };

  if (isLoading) return <div className="min-h-[400px] flex items-center justify-center text-gray-400 animate-pulse">Cargando detalles del pago...</div>;
  
  if (!sale) return <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">...</div>;

  // --- VISTA DE ESTADOS: YA PROCESADO ---
  if (sale.estado !== 'PENDIENTE_PAGO') {
      return (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100 animate-fade-in-up">
              {/* ... Vista de Aprobado/Rechazado ... */}
          </div>
      );
  }

  // --- VISTA PRINCIPAL: PENDIENTE DE PAGO ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto animate-fade-in">
        
        {/* Columna 1: Instrucciones Dinámicas */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">1</div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {sale.medioPago === 'EFECTIVO' ? 'Acércate al Local' : 'Realiza el Pago'}
                </h2>
            </div>
            {renderPaymentInfo()}
        </div>

        {/* Columna 2: Formulario de Subida */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black">2</div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {sale.medioPago === 'EFECTIVO' ? 'Confirmar Retiro' : 'Sube el Comprobante'}
                </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
                <p className="text-gray-500 text-sm">
                    {sale.medioPago === 'EFECTIVO' 
                        ? 'Para archivar la compra, sube una foto del ticket recibido en el local.' 
                        : 'Una vez realizado el pago, sube una captura clara del comprobante para que podamos procesar tu pedido.'}
                </p>

                <div 
                    className={`flex-1 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative min-h-[300px] flex flex-col items-center justify-center cursor-pointer group ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-200 hover:border-primary hover:bg-gray-50'} ${previewUrl ? 'border-solid border-green-500 bg-white' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                >
                    <input type="file" id="comprobante" accept="image/*,.pdf" {...register('comprobante')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    
                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={previewUrl} alt="Comprobante seleccionado" className="max-h-64 max-w-full rounded-lg shadow-lg object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Cambiar Imagen</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pointer-events-none">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            </div>
                            <p className="text-lg font-bold text-gray-800">Haz clic o arrastra aquí</p>
                            <p className="text-sm text-gray-400 mt-1">Soporta JPG, PNG, PDF</p>
                        </div>
                    )}
                </div>
                
                <button disabled={!previewUrl && sale?.medioPago !== 'EFECTIVO'} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg disabled:opacity-50">
                    {previewUrl || sale?.medioPago === 'EFECTIVO' ? (sale.medioPago === 'EFECTIVO' ? 'Confirmar Retiro' : 'Enviar Comprobante') : 'Selecciona un archivo primero'}
                </button>
            </form>
        </div>
    </div>
  );
}