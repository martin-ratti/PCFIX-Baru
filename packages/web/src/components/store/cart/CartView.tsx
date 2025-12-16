import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../../ui/feedback/ConfirmModal';
import ErrorBoundary from '../../ui/feedback/ErrorBoundary';
import EmptyState from '../../ui/feedback/EmptyState';

import { API_URL } from '../../../utils/api';


function CartContent() {
    const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
    const { user, token, isAuthenticated } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);

    const [isClient, setIsClient] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const [deliveryType, setDeliveryType] = useState<'ENVIO' | 'RETIRO'>('ENVIO');
    const [paymentMethod, setPaymentMethod] = useState<'TRANSFERENCIA' | 'BINANCE' | 'EFECTIVO' | 'MERCADOPAGO'>('TRANSFERENCIA');

    const [zipCode, setZipCode] = useState('');
    const [shippingCost, setShippingCost] = useState<number | null>(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    // Dirección de envío para Zipnova
    const [direccion, setDireccion] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [provincia, setProvincia] = useState('');
    const [telefono, setTelefono] = useState('');
    const [documento, setDocumento] = useState(''); // DNI del destinatario

    const [baseShippingCost, setBaseShippingCost] = useState(0);
    const [localAddress, setLocalAddress] = useState('');

    useEffect(() => {
        setIsClient(true);
        // Non-blocking config fetch - errors are logged but don't crash the page
        const loadConfig = async () => {
            try {
                const res = await fetch(
                    `${API_URL}/config`
                );
                const data = await res.json();
                if (data.success && data.data) {
                    setBaseShippingCost(Number(data.data.costoEnvioFijo));
                    setLocalAddress(data.data.direccionLocal || 'Dirección no configurada');
                }
            } catch (err) {
                console.error("Error loading config:", err);
                // Continue with defaults, don't crash the page
            }
        };
        loadConfig();
    }, []);


    useEffect(() => {
        if (deliveryType === 'ENVIO' && paymentMethod === 'EFECTIVO') {
            setPaymentMethod('TRANSFERENCIA');
        }
    }, [deliveryType, paymentMethod]);

    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Apply 8% Discount if NOT Mercado Pago
    const discountFactor = paymentMethod !== 'MERCADOPAGO' ? 0.92 : 1;
    const finalSubtotal = subtotal * discountFactor;

    // Apply 21% VAT to shipping cost if delivery type is ENVIO
    const finalShippingCost = deliveryType === 'ENVIO' && shippingCost !== null ? (shippingCost * 1.21) : 0;

    const totalFinal = finalSubtotal + finalShippingCost;

    const handleCalculateShipping = async () => {
        if (!zipCode || zipCode.length < 4) {
            addToast("Ingresa un Código Postal válido", 'error');
            return;
        }

        // Si es CP local (2183), cambiar a retiro automáticamente
        if (zipCode === '2183') {
            setDeliveryType('RETIRO');
            setShippingCost(null);
            addToast("¡Estás cerca! Contactanos para coordinar la entrega 📞", 'success');
            return;
        }

        setIsCalculatingShipping(true);

        try {
            const itemsPayload = items.map(i => ({ id: i.id, quantity: i.quantity }));

            const response = await fetch(`${API_URL}/sales/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ zipCode, items: itemsPayload })
            });

            const data = await response.json();

            if (data.success) {
                setShippingCost(Number(data.data.cost));
                addToast(`Envío cotizado: $${data.data.cost}`, 'success');
            } else {
                throw new Error(data.error || "Error al cotizar");
            }
        } catch (error: any) {
            console.error("Error cotizando envío:", error);
            addToast("No pudimos cotizar con el transporte. Usando tarifa base.", 'error');
            setShippingCost(baseShippingCost);
        } finally {
            setIsCalculatingShipping(false);
        }
    };

    const handleCheckout = async () => {
        if (!isAuthenticated || !user || !token) {
            addToast("Inicia sesión para comprar", 'error');
            window.location.href = '/auth/login';
            return;
        }

        if (deliveryType === 'ENVIO' && shippingCost === null) {
            addToast("Calcula el envío para continuar", 'error');
            document.getElementById('zipCodeInput')?.focus();
            return;
        }

        // Validar dirección completa para envío
        if (deliveryType === 'ENVIO') {
            if (!direccion.trim()) {
                addToast("Ingresa tu dirección (calle y número)", 'error');
                document.getElementById('direccionInput')?.focus();
                return;
            }
            if (!ciudad.trim()) {
                addToast("Ingresa tu ciudad/localidad", 'error');
                document.getElementById('ciudadInput')?.focus();
                return;
            }
            if (!provincia) {
                addToast("Selecciona tu provincia", 'error');
                return;
            }
            // DNI requerido para etiqueta de envío
            if (!documento.trim() || documento.length < 7) {
                addToast("Ingresa un DNI válido (requerido para envíos)", 'error');
                document.getElementById('documentoInput')?.focus();
                return;
            }
        }


        if (deliveryType === 'ENVIO' && paymentMethod === 'EFECTIVO') {
            addToast("Pago en efectivo solo disponible para retiro en local", 'error');
            setPaymentMethod('TRANSFERENCIA');
            return;
        }

        setIsProcessing(true);
        try {
            const payload = {
                items: items.map(i => ({ id: i.id, quantity: i.quantity })),
                subtotal: Number(subtotal),
                cpDestino: deliveryType === 'ENVIO' ? zipCode : undefined,
                tipoEntrega: deliveryType,
                medioPago: paymentMethod,
                // Dirección para Zipnova
                direccionEnvio: deliveryType === 'ENVIO' ? direccion : undefined,
                ciudadEnvio: deliveryType === 'ENVIO' ? ciudad : undefined,
                provinciaEnvio: deliveryType === 'ENVIO' ? provincia : undefined,
                telefonoEnvio: deliveryType === 'ENVIO' ? telefono : undefined,
                documentoEnvio: deliveryType === 'ENVIO' ? documento : undefined
            };

            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                clearCart();
                navigate(`/checkout/${json.data.id}`);
            } else { throw new Error(json.error); }
        } catch (e: any) {
            addToast(e.message, 'error');
            setIsProcessing(false);
        }
    };

    if (!isClient) return null;

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-12">
                <EmptyState
                    title="Tu carrito está vacío"
                    description="Parece que aún no has agregado productos. ¡Explorá nuestro catálogo y encontrá lo que buscas!"
                    icon={
                        <div className="relative">
                            <span className="text-6xl filter grayscale opacity-50">🛒</span>
                            <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">0</div>
                        </div>
                    }
                    action={{
                        label: "Ver Productos",
                        href: "/tienda/productos"
                    }}
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-4">
                <h1 className="text-2xl font-black text-secondary mb-4 border-b pb-2">Tu Carrito ({items.length})</h1>
                {items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                        <img src={item.imageUrl} alt={item.imageAlt} className="w-20 h-20 object-cover rounded-md border border-gray-200" />
                        <div className="flex-grow text-center sm:text-left">
                            <h2 className="font-bold text-secondary text-sm">{item.name}</h2>
                            <p className="text-primary font-black text-base mt-1">${item.price.toLocaleString('es-AR')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => decreaseQuantity(item.id)} className="px-2 font-bold hover:bg-gray-100 rounded">-</button>
                            <span className="px-2 font-medium text-sm">{item.quantity}</span>
                            <button onClick={() => increaseQuantity(item.id)} className="px-2 font-bold hover:bg-gray-100 rounded">+</button>
                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24 space-y-6">
                    <h2 className="text-lg font-bold text-secondary border-b pb-3">Opciones de Pedido</h2>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setDeliveryType('ENVIO')} className={`p-3 rounded-lg border text-sm font-bold transition-colors ${deliveryType === 'ENVIO' ? 'border-primary bg-blue-50 text-primary' : 'hover:bg-gray-50'}`}>Envío</button>
                        <button onClick={() => setDeliveryType('RETIRO')} className={`p-3 rounded-lg border text-sm font-bold transition-colors ${deliveryType === 'RETIRO' ? 'border-green-500 bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}>Retiro</button>
                    </div>

                    {deliveryType === 'ENVIO' ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Envío a Domicilio</p>
                            {shippingCost === null ? (
                                <div className="flex gap-2">
                                    <input type="text" id="zipCodeInput" placeholder="Cód. Postal" value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full border rounded px-2 py-1.5 text-sm" />
                                    <button onClick={handleCalculateShipping} disabled={isCalculatingShipping} className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded whitespace-nowrap flex items-center gap-1 disabled:opacity-70">
                                        {isCalculatingShipping ? <><div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /></> : 'Cotizar'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm">CP {zipCode}</span>
                                        <div className="text-right">
                                            <span className="block font-bold text-green-600">${shippingCost.toLocaleString('es-AR')}</span>
                                            <button onClick={() => setShippingCost(null)} className="text-[10px] text-blue-500 hover:underline">Cambiar</button>
                                        </div>
                                    </div>
                                    {/* Formulario dirección */}
                                    <div className="space-y-2">
                                        <input
                                            type="text" id="direccionInput"
                                            placeholder="Calle y número *"
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            className="w-full border rounded px-2 py-1.5 text-sm"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" id="ciudadInput"
                                                placeholder="Ciudad *"
                                                value={ciudad}
                                                onChange={(e) => setCiudad(e.target.value)}
                                                className="border rounded px-2 py-1.5 text-sm"
                                            />
                                            <select
                                                value={provincia}
                                                onChange={(e) => setProvincia(e.target.value)}
                                                className="border rounded px-2 py-1.5 text-sm bg-white"
                                            >
                                                <option value="">Provincia *</option>
                                                <option value="Buenos Aires">Buenos Aires</option>
                                                <option value="CABA">CABA</option>
                                                <option value="Catamarca">Catamarca</option>
                                                <option value="Chaco">Chaco</option>
                                                <option value="Chubut">Chubut</option>
                                                <option value="Córdoba">Córdoba</option>
                                                <option value="Corrientes">Corrientes</option>
                                                <option value="Entre Ríos">Entre Ríos</option>
                                                <option value="Formosa">Formosa</option>
                                                <option value="Jujuy">Jujuy</option>
                                                <option value="La Pampa">La Pampa</option>
                                                <option value="La Rioja">La Rioja</option>
                                                <option value="Mendoza">Mendoza</option>
                                                <option value="Misiones">Misiones</option>
                                                <option value="Neuquén">Neuquén</option>
                                                <option value="Río Negro">Río Negro</option>
                                                <option value="Salta">Salta</option>
                                                <option value="San Juan">San Juan</option>
                                                <option value="San Luis">San Luis</option>
                                                <option value="Santa Cruz">Santa Cruz</option>
                                                <option value="Santa Fe">Santa Fe</option>
                                                <option value="Santiago del Estero">Santiago del Estero</option>
                                                <option value="Tierra del Fuego">Tierra del Fuego</option>
                                                <option value="Tucumán">Tucumán</option>
                                            </select>
                                        </div>
                                        {/* DNI y Teléfono */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" id="documentoInput"
                                                placeholder="DNI *"
                                                value={documento}
                                                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                className="border rounded px-2 py-1.5 text-sm"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Teléfono"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-xs font-bold text-green-700 uppercase mb-1">Retiro Sin Cargo</p>
                            <p className="text-sm text-gray-700 font-medium">{localAddress}</p>
                        </div>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Pago</p>
                            {paymentMethod !== 'MERCADOPAGO' && (
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 animate-pulse">
                                    8% OFF APLICADO
                                </span>
                            )}
                        </div>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full p-2 border rounded-lg text-sm bg-white">
                            <option value="TRANSFERENCIA">🏦 Transferencia Bancaria (8% OFF)</option>
                            <option value="MERCADOPAGO">💳 Mercado Pago</option>
                            <option value="BINANCE">🪙 Crypto (Binance Pay) (8% OFF)</option>
                            {deliveryType === 'RETIRO' && <option value="EFECTIVO">💵 Efectivo en Local (8% OFF)</option>}
                        </select>
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span></div>

                        {paymentMethod !== 'MERCADOPAGO' && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>Descuento Pago (8% OFF)</span>
                                <span>-${(subtotal * 0.08).toLocaleString('es-AR')}</span>
                            </div>
                        )}

                        {deliveryType === 'ENVIO' && (
                            <div className="flex justify-between text-blue-600">
                                <span>Envío (con IVA)</span>
                                <span>{shippingCost !== null ? `$${finalShippingCost.toLocaleString('es-AR')}` : 'Calculando...'}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-2 border-t font-bold text-lg"><span>Total Final</span><span>${totalFinal.toLocaleString('es-AR')}</span></div>
                    </div>

                    <button onClick={handleCheckout} disabled={isProcessing || (deliveryType === 'ENVIO' && shippingCost === null)} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2">
                        {isProcessing ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Procesando...</> : 'Finalizar Compra'}
                    </button>

                    <div className="flex justify-between items-center mt-2">
                        <button onClick={() => navigate('/')} className="text-xs text-gray-500 hover:text-primary underline">Seguir comprando</button>
                        <button onClick={() => setIsClearModalOpen(true)} className="text-xs text-red-400 hover:text-red-600">Vaciar carrito</button>
                    </div>
                </div>
            </div>
            <ConfirmModal isOpen={isClearModalOpen} title="Vaciar Carrito" message="¿Eliminar todo?" confirmText="Sí, vaciar" isDanger={true} onConfirm={() => { clearCart(); setIsClearModalOpen(false); }} onCancel={() => setIsClearModalOpen(false)} />
        </div>
    );
}

export default function CartView() {
    return (
        <ErrorBoundary fallback={
            <div className="p-8 text-center border-2 border-red-100 rounded-xl bg-red-50">
                <h3 className="text-red-800 font-bold mb-2">Error en el carrito</h3>
                <p className="text-red-600 text-sm mb-4">Ocurrió un problema al cargar tu pedido. Por favor intenta recargar.</p>
                <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Recargar Página</button>
            </div>
        }>
            <CartContent />
        </ErrorBoundary>
    );
}