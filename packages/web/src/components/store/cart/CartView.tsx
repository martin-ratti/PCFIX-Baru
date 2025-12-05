import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../stores/cartStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../../ui/feedback/ConfirmModal';

export default function CartView() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
  const { user, token, isAuthenticated } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Opciones de Compra
  const [deliveryType, setDeliveryType] = useState<'ENVIO' | 'RETIRO'>('ENVIO');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFERENCIA' | 'BINANCE' | 'EFECTIVO'>('TRANSFERENCIA');
  
  // Datos Envío
  const [zipCode, setZipCode] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
  // Configuración (Backend)
  const [baseShippingCost, setBaseShippingCost] = useState(0);
  const [localAddress, setLocalAddress] = useState('');

  useEffect(() => {
      setIsClient(true);
      fetch('http://localhost:3002/api/config')
        .then(res => res.json())
        .then(data => {
            if(data.success && data.data) {
                setBaseShippingCost(Number(data.data.costoEnvioFijo));
                // Guardamos la dirección real de la DB
                setLocalAddress(data.data.direccionLocal || 'Dirección no configurada'); 
            }
        })
        .catch(err => console.error("Error config:", err));
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalShippingCost = deliveryType === 'ENVIO' ? (shippingCost || 0) : 0;
  const totalFinal = subtotal + finalShippingCost;

  const handleCalculateShipping = async () => {
    if (!zipCode || zipCode.length < 4) {
        addToast("Ingresa un Código Postal válido", 'error');
        return;
    }
    setIsCalculatingShipping(true);
    // Simulación de cálculo (en producción llamarías a tu API de envíos)
    setTimeout(() => {
        setShippingCost(baseShippingCost); 
        setIsCalculatingShipping(false);
        addToast("Costo de envío calculado", 'success');
    }, 600);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user || !token) {
        addToast("Inicia sesión para comprar", 'error');
        window.location.href = '/login';
        return;
    }

    // Validación: Si es envío, debe haber calculado el costo
    if (deliveryType === 'ENVIO' && shippingCost === null) {
        addToast("Calcula el envío para continuar", 'error');
        document.getElementById('zipCodeInput')?.focus();
        return;
    }
    
    // Validación: Efectivo solo en local
    if (deliveryType === 'ENVIO' && paymentMethod === 'EFECTIVO') {
         addToast("Pago en efectivo solo disponible para retiro en local", 'error');
         return;
    }
    
    setIsProcessing(true);
    try {
        const res = await fetch('http://localhost:3002/api/sales', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: items,
                // Enviamos opciones elegidas
                cpDestino: deliveryType === 'ENVIO' ? zipCode : undefined,
                tipoEntrega: deliveryType,
                medioPago: paymentMethod
            })
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
      <div className="text-center py-20 bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-secondary mb-4">Tu carrito está vacío</h1>
        <a href="/productos" className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-colors shadow-md">Ir a la Tienda</a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      {/* Lista de Productos */}
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
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-8">
                    <button onClick={() => decreaseQuantity(item.id)} className="px-2 hover:bg-gray-100 text-gray-600 font-bold">-</button>
                    <span className="px-2 font-medium text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)} className="px-2 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
               </div>
            </div>
        ))}
      </div>

      {/* Resumen y Opciones */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24 space-y-6">
          <h2 className="text-lg font-bold text-secondary border-b pb-3">Opciones de Pedido</h2>
          
          {/* 1. TIPO DE ENTREGA */}
          <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Entrega</p>
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setDeliveryType('ENVIO')} className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-1 ${deliveryType === 'ENVIO' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <span>🚚</span> Envío
                  </button>
                  <button onClick={() => { setDeliveryType('RETIRO'); if(paymentMethod === 'TRANSFERENCIA') setPaymentMethod('EFECTIVO'); }} className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-1 ${deliveryType === 'RETIRO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <span>🏪</span> Retiro
                  </button>
              </div>
          </div>

          {/* Lógica de Envío */}
          {deliveryType === 'ENVIO' ? (
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                   <p className="text-xs font-bold text-gray-500 uppercase mb-2">Calculadora de Envío</p>
                   {shippingCost === null ? (
                       <div className="flex gap-2">
                           <input type="text" id="zipCodeInput" placeholder="Cód. Postal" value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none" />
                           <button onClick={handleCalculateShipping} disabled={isCalculatingShipping} className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-opacity-90 whitespace-nowrap">
                               {isCalculatingShipping ? '...' : 'Calcular'}
                           </button>
                       </div>
                   ) : (
                       <div className="flex justify-between items-center">
                           <span className="text-sm text-secondary font-medium">A domicilio (CP {zipCode})</span>
                           <div className="text-right">
                               <span className="block font-bold text-secondary">${shippingCost.toLocaleString('es-AR')}</span>
                               <button onClick={() => setShippingCost(null)} className="text-[10px] text-blue-500 hover:underline">Cambiar CP</button>
                           </div>
                       </div>
                   )}
               </div>
          ) : (
               <div className="bg-green-50 p-4 rounded-lg border border-green-100 animate-fade-in">
                   <p className="text-xs font-bold text-green-700 uppercase mb-1">Retiro Sin Cargo</p>
                   {/* Aquí mostramos la dirección dinámica */}
                   <p className="text-sm text-gray-700 font-medium">{localAddress}</p>
               </div>
          )}

          {/* 2. MEDIO DE PAGO */}
          <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pago</p>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
              >
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="BINANCE">🪙 Crypto (Binance Pay)</option>
                  {/* Solo mostramos Efectivo si es retiro */}
                  {deliveryType === 'RETIRO' && <option value="EFECTIVO">💵 Efectivo en Local</option>}
              </select>
          </div>

          {/* TOTALES */}
          <div className="border-t pt-4 space-y-2 text-sm">
             <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span></div>
             {deliveryType === 'ENVIO' && <div className="flex justify-between text-gray-600"><span>Envío</span><span>{shippingCost !== null ? `$${shippingCost.toLocaleString('es-AR')}` : 'Calculando...'}</span></div>}
             <div className="flex justify-between items-end pt-2 border-t border-dashed">
                <span className="text-lg font-bold text-secondary">Total Final</span>
                <span className="text-3xl font-black text-primary">${totalFinal.toLocaleString('es-AR')}</span>
             </div>
          </div>
          
          <button 
              onClick={handleCheckout} 
              disabled={isProcessing || (deliveryType === 'ENVIO' && shippingCost === null)} 
              className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
          >
            {isProcessing ? 'Procesando...' : 'Finalizar Compra'}
          </button>
          
          <div className="flex justify-between items-center mt-2">
              <button onClick={() => navigate('/')} className="text-xs text-gray-500 hover:text-primary underline">Seguir comprando</button>
              <button onClick={() => setIsClearModalOpen(true)} className="text-xs text-red-400 hover:text-red-600">Vaciar carrito</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Vaciar Carrito"
        message="¿Eliminar todos los productos?"
        confirmText="Sí, vaciar"
        isDanger={true}
        onConfirm={() => { clearCart(); setIsClearModalOpen(false); }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
}