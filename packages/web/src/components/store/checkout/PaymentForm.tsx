import React, { useState, useEffect } from 'react';
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

    useEffect(() => { if (saleId) refreshData(); }, [saleId, token]);

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

    // 👇 FUNCIÓN QUE FALTABA
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

    const handlePayWithViumi = async () => {
        setIsLoading(true); // Bloquear UI
        try {
            const res = await fetchApi(`/sales/${saleId}/viumi-preference`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data.url) {
                window.location.href = data.data.url;
            } else {
                addToast('Error al generar link de pago', 'error');
                setIsLoading(false);
            }
        } catch (e) {
            addToast('Error de conexión', 'error');
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        const isCash = sale?.medioPago === 'EFECTIVO';
        if (!isCash && (!data.comprobante || data.comprobante.length === 0)) {
            addToast("Debes seleccionar una imagen", 'error'); return;
        }
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
    };

    // Renders
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

                        {sale.tipoEntrega === 'RETIRO' ? (
                            <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <input type="radio" name="pm" value="EFECTIVO" checked={tempPaymentMethod === 'EFECTIVO'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="text-blue-600" />
                                <span>💵 Efectivo en Local</span>
                            </label>
                        ) : (
                            <p className="text-xs text-gray-400 px-1 mt-1">* Efectivo no disponible para envío a domicilio.</p>
                        )}
                        <label className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-[#4429A6] transition-colors">
                            <input type="radio" name="pm" value="VIUMI" checked={tempPaymentMethod === 'VIUMI'} onChange={(e) => setTempPaymentMethod(e.target.value)} className="accent-[#4429A6]" />
                            <span>💳 Tarjeta de Débito/Crédito (ViüMi)</span>
                        </label>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleChangePaymentMethod} disabled={isUpdating} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95">{isUpdating ? '...' : 'Guardar'}</button>
                        <button onClick={() => setIsEditingPayment(false)} className="px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-200 rounded-lg transition-all active:scale-95">Cancelar</button>
                    </div>
                </div>
            );
        }

        if (sale.medioPago === 'VIUMI') {
            return (
                <div className="space-y-6 animate-fade-in text-center">
                    {/* Card con gradiente Viumi */}
                    <div className="bg-gradient-to-br from-[#4429A6] to-[#3A238C] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total a Pagar</p>
                        <p className="text-4xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <button onClick={handlePayWithViumi} className="w-full bg-gradient-to-r from-[#4429A6] to-[#3A238C] text-white py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
                            <span>💳 Pagar con Tarjeta (ViüMi)</span>
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Serás redirigido a un sitio seguro.</p>
                    </div>
                </div>
            );
        }

        if (sale.medioPago === 'BINANCE') {
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-yellow-400 p-6 rounded-2xl text-black shadow-lg text-center relative overflow-hidden">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Monto USDT</p>
                        <p className="text-4xl font-black tracking-tight">{(Number(sale.montoTotal) / usdtRate).toFixed(2)} USDT</p>
                        <p className="text-xs mt-2 opacity-75">1 USDT = ${usdtRate} ARS</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Binance Pay ID</p>
                        <p className="text-lg font-mono font-bold text-gray-800 select-all">{config.binanceCbu || 'N/A'}</p>
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
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg text-center">
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Monto Exacto</p>
                    <p className="text-5xl font-black tracking-tight">${Number(sale.montoTotal).toLocaleString('es-AR')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">CBU / CVU</p>
                    <p className="text-lg font-mono font-bold text-gray-800 select-all break-all">{config.cbu}</p>
                    <p className="text-sm text-gray-600 mt-1 font-bold">{config.alias}</p>
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto animate-fade-in pb-12">
            <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100 h-fit relative">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                            <h2 className="text-xl font-bold text-gray-800">Pago</h2>
                        </div>
                        <p className="text-sm text-gray-400 ml-11 mt-1">Método: <strong>{sale.medioPago}</strong></p>
                    </div>
                    {!isEditingPayment && (
                        <button onClick={() => setIsEditingPayment(true)} className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full transition-all active:scale-95">
                            Cambiar Método de Pago
                        </button>
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
                        {isCash ? 'Confirmar' : (sale.medioPago === 'VIUMI' ? 'Instrucciones' : 'Comprobante')}
                    </h2>
                </div>

                {sale.medioPago === 'VIUMI' ? (
                    <div className="bg-[#4429A6]/5 p-6 rounded-xl border border-[#4429A6]/20 text-center animate-fade-in">
                        <span className="text-4xl mb-4 block">💳</span>
                        <p className="text-[#3A238C] font-bold">Pago con Tarjeta</p>
                        <p className="text-[#4429A6] text-sm mt-2">
                            Haz clic en el botón <strong>"Pagar con Tarjeta"</strong> a la izquierda para procesar tu pago de forma segura a través de ViüMi.
                        </p>
                        <p className="text-xs text-gray-400 mt-4">No es necesario subir comprobante.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {!isCash ? (
                            <div className="flex-1 border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-8 text-center relative min-h-[250px] flex flex-col items-center justify-center">
                                <input type="file" accept="image/*,.pdf" {...register('comprobante')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {previewUrl ? <img src={previewUrl} className="max-h-56 rounded shadow object-contain" /> : (
                                    <>
                                        <span className="text-4xl mb-2">📷</span>
                                        <p className="text-gray-500 font-medium">Sube tu comprobante aquí</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                                <span className="text-4xl mb-4 block">🤝</span>
                                <p className="text-green-800 font-bold">Pago Presencial</p>
                                <p className="text-green-600 text-sm mt-1">Confirma para reservar tu stock por 24hs.</p>
                            </div>
                        )}

                        <button disabled={!previewUrl && !isCash} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all active:scale-95 shadow-lg disabled:opacity-50">
                            {previewUrl || isCash ? (isCash ? 'Confirmar Retiro' : 'Enviar Comprobante') : 'Selecciona archivo'}
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