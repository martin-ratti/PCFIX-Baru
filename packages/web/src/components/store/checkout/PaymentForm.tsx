import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import { fetchApi } from '../../../utils/api';

interface PaymentFormProps { saleId: number; }

export default function PaymentForm({ saleId }: PaymentFormProps) {
    const [sale, setSale] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [tempPaymentMethod, setTempPaymentMethod] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const { token } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const { register, handleSubmit, watch, reset } = useForm();
    const fileWatch = watch('comprobante');
    const [showSummary, setShowSummary] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        addToast(`${label} copiado al portapapeles`, 'success');
    };

    useEffect(() => {
        if (fileWatch && fileWatch.length > 0) {
            const file = fileWatch[0];
            if (file.size > 5 * 1024 * 1024) {
                addToast("La imagen es muy pesada (Máx 5MB)", 'error');
                reset(); return;
            }
            setPreviewUrl(URL.createObjectURL(file));
        } else { setPreviewUrl(null); }
    }, [fileWatch]);

    const refreshData = async () => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [saleRes, configRes] = await Promise.all([
                fetchApi(`/sales/${saleId}`, { headers }),
                fetchApi(`/config`)
            ]);

            const sData = await saleRes.json();
            const cData = await configRes.json();

            if (sData.success) {
                setSale(sData.data);
                setTempPaymentMethod(sData.data.medioPago);
            }
            if (cData.success) setConfig(cData.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        if (!saleId) return;
        refreshData();

        
        const interval = setInterval(() => {
            if (saleId) refreshData();
        }, 5000);

        return () => clearInterval(interval);
    }, [saleId, token]);

    const handleChangePaymentMethod = async () => {
        setIsUpdating(true);
        try {
            const res = await fetchApi(`/sales/${saleId}/payment-method`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ medioPago: tempPaymentMethod })
            });
            if (res.ok) {
                addToast('Método de pago actualizado', 'success');
                setIsEditingPayment(false);
                refreshData();
            } else throw new Error();
        } catch (e) { addToast('Error al cambiar método', 'error'); }
        finally { setIsUpdating(false); }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const confirmCancellation = async () => {
        setIsUpdating(true);
        try {
            const res = await fetchApi(`/sales/${saleId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'CANCELADO' })
            });
            if (res.ok) {
                addToast('Compra cancelada correctamente', 'info');
                navigate('/cuenta/miscompras');
            } else throw new Error();
        } catch (e) { addToast('Error al cancelar', 'error'); }
        finally { setIsUpdating(false); setShowCancelModal(false); }
    };

    const handlePayWithMP = async () => {
        setIsLoading(true);
        try {
            const res = await fetchApi(`/sales/${saleId}/mp-preference`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data.url) {
                window.open(data.data.url, '_blank');
                setIsLoading(false); 
            } else {
                addToast('Error al generar pago con MP', 'error');
                setIsLoading(false);
            }
        } catch (e) {
            addToast('Error de conexión con MP', 'error');
            setIsLoading(false);
        }
    };

    

    const onSubmit = async (data: any) => {
        const isCash = sale?.medioPago === 'EFECTIVO';
        if (!isCash && (!data.comprobante || data.comprobante.length === 0)) {
            addToast("Debes seleccionar una imagen", 'error'); return;
        }
        setIsUpdating(true);
        const formData = new FormData();
        if (data.comprobante && data.comprobante.length > 0) formData.append('comprobante', data.comprobante[0]);

        try {
            const res = await fetchApi(`/sales/${saleId}/receipt`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if ((await res.json()).success) {
                addToast(isCash ? "Retiro confirmado" : "¡Comprobante enviado!", 'success');
                window.location.reload();
            } else throw new Error();
        } catch (e) { addToast('Error al subir', 'error'); }
        finally { setIsUpdating(false); }
    };

    
    const renderPaymentInfo = () => {
        if (!sale || !config) return null;
        const usdtRate = Number(config.cotizacionUsdt) || 1150;

        if (isEditingPayment) {
            return (
                <div className="bg-gray-50 p-6 rounded-2xl border border-blue-200 animate-fade-in">
                    <p className="text-sm font-bold text-gray-700 mb-3">Selecciona nuevo método:</p>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <input type="radio" name="pm" value="TRANSFERENCIA" checked={tempPaymentMethod === 'TRANSFERENCIA'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="text-blue-600" />
                            <span>🏦 Transferencia Bancaria</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <input type="radio" name="pm" value="BINANCE" checked={tempPaymentMethod === 'BINANCE'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="text-blue-600" />
                            <span>🪙 Binance Pay (USDT)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-[#009EE3] transition-colors">
                            <input type="radio" name="pm" value="MERCADOPAGO" checked={tempPaymentMethod === 'MERCADOPAGO'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="accent-[#009EE3]" />
                            <span>💳 Mercado Pago</span>
                        </label>

                        {sale.tipoEntrega === 'RETIRO' ? (
                            <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <input type="radio" name="pm" value="EFECTIVO" checked={tempPaymentMethod === 'EFECTIVO'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="text-blue-600" />
                                <span>💵 Efectivo en Local</span>
                            </label>
                        ) : (
                            <p className="text-xs text-gray-400 px-1 mt-1">* Efectivo no disponible para envío a domicilio.</p>
                        )}
                        
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleChangePaymentMethod} disabled={isUpdating} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                            {isUpdating ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /></> : 'Guardar'}
                        </button>
                        <button onClick={() => setIsEditingPayment(false)} className="px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-200 rounded-lg transition-all active:scale-95">Cancelar</button>
                    </div>
                </div>
            );
        }

        

        if (sale.medioPago === 'MERCADOPAGO') {
            return (
                <div className="space-y-6 animate-fade-in text-center">
                    <div className="bg-[#009EE3] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total a Pagar</p>
                        <p className="text-4xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <button onClick={handlePayWithMP} disabled={isLoading} className="w-full bg-[#009EE3] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#008CC9] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-75">
                            {isLoading ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Iniciando...</> : <span>Pagar con Mercado Pago</span>}
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Se abrirá una nueva pestaña para completar el pago.</p>
                    </div>
                </div>
            );
        }

        if (sale.medioPago === 'BINANCE') {
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-yellow-400 p-6 rounded-2xl text-black shadow-lg text-center relative overflow-hidden group">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Monto USDT</p>
                        <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => copyToClipboard((Number(sale.montoTotal) / usdtRate).toFixed(2), 'Monto USDT')}>
                            <p className="text-4xl font-black tracking-tight">{(Number(sale.montoTotal) / usdtRate).toFixed(2)} USDT</p>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-0 group-hover:opacity-50 transition-opacity"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" /></svg>
                        </div>
                        <p className="text-xs mt-2 opacity-75">1 USDT = ${usdtRate} ARS</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center relative group">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Binance Pay ID</p>
                        <p className="text-lg font-mono font-bold text-gray-800 select-all">{config.binanceCbu || 'N/A'}</p>
                        <button
                            onClick={() => copyToClipboard(config.binanceCbu || '', 'Binance ID')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            title="Copiar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                        </button>
                    </div>
                </div>
            );
        }
        if (sale.medioPago === 'EFECTIVO') {
            return (
                <div className="space-y-8 animate-fade-in text-center">
                    <div className="bg-green-600 p-6 rounded-2xl text-white shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total a Pagar</p>
                        <p className="text-4xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-left">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-2">📍 Dirección de Retiro</p>
                        <p className="text-lg font-bold text-gray-900">{config.direccionLocal}</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg text-center group cursor-pointer" onClick={() => copyToClipboard(Number(sale.montoTotal).toString(), 'Monto Total')}>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Monto Exacto</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-5xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 opacity-0 group-hover:opacity-50 transition-opacity"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center relative group">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">CBU / CVU</p>
                        <p className="text-lg font-mono font-bold text-gray-800 break-all">{config.cbu}</p>
                        <button
                            onClick={() => copyToClipboard(config.cbu, 'CBU/CVU')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            title="Copiar CBU"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                        </button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center relative group">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Alias</p>
                        <p className="text-lg font-mono font-bold text-gray-800">{config.alias}</p>
                        <button
                            onClick={() => copyToClipboard(config.alias, 'Alias')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            title="Copiar Alias"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="min-h-[400px] flex items-center justify-center text-gray-400 animate-pulse">Cargando...</div>;
    if (!sale) return <div className="text-center p-12">Pedido no encontrado</div>;

    if (sale.estado !== 'PENDIENTE_PAGO') {
        return (
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-xl text-center border border-gray-100 animate-fade-in-up">
                <div className="mb-6 text-6xl">{sale.estado === 'APROBADO' ? '🎉' : '⏳'}</div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{sale.estado === 'APROBADO' ? '¡Pago Aprobado!' : 'En Revisión'}</h2>
                <p className="text-gray-500 mb-8">
                    {sale.estado === 'PENDIENTE_APROBACION'
                        ? 'Estamos verificando tu pago. Te avisaremos por email.'
                        : 'Tu compra fue aprobada exitosamente.'}
                </p>
                <a href="/cuenta/miscompras" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Ver Mis Compras</a>
            </div>
        );
    }

    const isCash = sale.medioPago === 'EFECTIVO';
    const isMP = sale.medioPago === 'MERCADOPAGO';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto animate-fade-in pb-12">
            <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit relative">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                            <h2 className="text-xl font-bold text-gray-800">Pago</h2>
                        </div>
                        <p className="text-sm text-gray-400 ml-11 mt-1">Método: <strong>{sale.medioPago === 'VIUMI' ? 'MERCADOPAGO (Actualizado)' : sale.medioPago}</strong></p>
                    </div>
                    {!isEditingPayment && (
                        <button onClick={() => setIsEditingPayment(true)} className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full transition-all active:scale-95">
                            Cambiar Método de Pago
                        </button>
                    )}
                </div>

                
                <div className="mb-6 border rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowSummary(!showSummary)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <span className="font-bold text-sm text-gray-600">Resumen del Pedido (#{sale.id})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${showSummary ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    {showSummary && (
                        <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                            {sale.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.quantity}x {item.product.nombre}</span>
                                    <span className="font-medium">${Number(item.price).toLocaleString('es-AR')}</span>
                                </div>
                            ))}
                            <div className="pt-2 border-t flex justify-between font-bold text-gray-800">
                                <span>Total</span>
                                <span>${Number(sale.montoTotal).toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {renderPaymentInfo()}

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                    <button onClick={handleCancelClick} className="text-red-400 hover:text-red-600 text-sm font-medium flex items-center gap-1 transition-all active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Cancelar Pedido
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-sm">2</div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {isCash ? 'Confirmar' : (isMP ? 'Pago Online' : 'Comprobante')}
                    </h2>
                </div>

                {isMP ? (
                    <div className="bg-[#009EE3]/5 p-6 rounded-xl border border-[#009EE3]/20 text-center animate-fade-in">
                        <span className="text-4xl mb-4 block">💳</span>
                        <p className="text-[#009EE3] font-bold">Mercado Pago</p>
                        <p className="text-gray-600 text-sm mt-2">
                            Haz clic en el botón <strong>"Pagar con Mercado Pago"</strong> para abrir la ventana de pago.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {!isCash ? (
                            <div className="space-y-4">
                                <div className="flex-1 border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-8 text-center relative min-h-[250px] flex flex-col items-center justify-center transition-colors group">
                                    <input type="file" accept="image/*,.pdf" {...register('comprobante')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {previewUrl ? (
                                        <div className="relative">
                                            <img src={previewUrl} className="max-h-48 rounded shadow-lg object-contain" />
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-blue-50 text-primary p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                            </div>
                                            <p className="text-gray-900 font-bold mb-1">Sube tu comprobante</p>
                                            <p className="text-gray-400 text-xs">Arrastra o haz clic para seleccionar</p>
                                        </>
                                    )}
                                </div>
                                {!previewUrl && (
                                    <div className="text-center">
                                        <div className="relative flex py-2 items-center">
                                            <div className="flex-grow border-t border-gray-100"></div>
                                            <span className="flex-shrink-0 mx-4 text-gray-300 text-xs uppercase font-bold">O envía por WhatsApp</span>
                                            <div className="flex-grow border-t border-gray-100"></div>
                                        </div>
                                        <a
                                            href={`https://wa.me/5491112345678?text=Hola!%20Envio%20comprobante%20del%20pedido%20%23${sale.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 font-bold rounded-xl hover:bg-green-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z" />
                                            </svg>
                                            Enviar por WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                                <span className="text-4xl mb-4 block">🤝</span>
                                <p className="text-green-800 font-bold">Pago Presencial</p>
                                <p className="text-green-600 text-sm mt-1">Confirma para reservar tu stock por 24hs.</p>
                            </div>
                        )}

                        <button disabled={(!previewUrl && !isCash) || isUpdating} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                            {isUpdating ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Procesando...</> : (previewUrl || isCash ? (isCash ? 'Confirmar Retiro' : 'Enviar Comprobante') : 'Selecciona archivo')}
                        </button>
                    </form>
                )}
            </div>

            <ConfirmModal
                isOpen={showCancelModal}
                title="Cancelar Pedido"
                message="¿Estás seguro de que deseas cancelar esta compra? El stock reservado será liberado y esta acción no se puede deshacer."
                confirmText="Sí, cancelar pedido"
                isDanger={true}
                onConfirm={confirmCancellation}
                onCancel={() => setShowCancelModal(false)}
            />
        </div>
    );
}