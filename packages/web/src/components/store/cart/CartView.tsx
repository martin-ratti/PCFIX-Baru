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

  // Estados para el envío
  const [zipCode, setZipCode] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null); // Null inicial para obligar a calcular
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [baseShippingCost, setBaseShippingCost] = useState(0); // Costo base desde config

  useEffect(() => {
      setIsClient(true);
      // Obtener costo de envío base desde la configuración del admin
      fetch('http://localhost:3002/api/config')
        .then(res => res.json())
        .then(data => {
            if(data.success) setBaseShippingCost(Number(data.data.costoEnvioFijo));
        })
        .catch(err => console.error("Error cargando config envío:", err));
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  // Si ya calculó el envío, lo sumamos. Si no, solo subtotal.
  const totalFinal = subtotal + (shippingCost || 0);

  // Función para simular el cálculo con Correo Argentino
  const handleCalculateShipping = async () => {
    if (!zipCode || zipCode.length < 4) {
        addToast("Ingresa un Código Postal válido", 'error');
        return;
    }

    setIsCalculatingShipping(true);
    
    // Simulamos delay de API real (UX)
    setTimeout(() => {
        // Aquí en el futuro haríamos: POST /api/shipping/quote { cp: zipCode }
        // Por ahora usamos el costo fijo configurado en el backend
        setShippingCost(baseShippingCost); 
        setIsCalculatingShipping(false);
        addToast("Costo de envío calculado", 'success');
    }, 800);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user || !token) {
        addToast("Inicia sesión para comprar", 'error');
        window.location.href = '/login';
        return;
    }

    if (shippingCost === null) {
        addToast("Por favor calcula el envío antes de continuar", 'error');
        // Hacemos foco en el input de CP
        document.getElementById('zipCodeInput')?.focus();
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
                total: subtotal, // Enviamos el subtotal (el back recalcula envío)
                cpDestino: zipCode
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

  if (!isClient) return null; // Skeleton...

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-secondary mb-4">Tu carrito está vacío</h1>
        <p className="text-muted mb-8">¡Explora nuestro catálogo y encuentra lo que buscas!</p>
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

      {/* Resumen y Calculadora de Envío */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
          <h2 className="text-lg font-bold text-secondary border-b pb-3 mb-4">Resumen del Pedido</h2>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-600">Subtotal productos</span>
                <span className="font-medium">${subtotal.toLocaleString('es-AR')}</span>
            </div>

            {/* CALCULADORA DE ENVÍO */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    Envío (Correo Argentino)
                </p>
                
                {shippingCost === null ? (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            id="zipCodeInput"
                            placeholder="Cód. Postal" 
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                        <button 
                            onClick={handleCalculateShipping}
                            disabled={isCalculatingShipping}
                            className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-opacity-90 transition-colors whitespace-nowrap"
                        >
                            {isCalculatingShipping ? '...' : 'Calcular'}
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center animate-in fade-in">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-secondary">A domicilio (CP {zipCode})</span>
                            <button onClick={() => setShippingCost(null)} className="text-[10px] text-blue-500 hover:underline text-left">Cambiar CP</button>
                        </div>
                        <span className="font-bold text-secondary">${shippingCost.toLocaleString('es-AR')}</span>
                    </div>
                )}
            </div>
          </div>
          
          <div className="flex justify-between items-end border-t pt-4 mb-6">
            <span className="text-lg font-bold text-secondary">Total Final</span>
            <span className="text-3xl font-black text-primary">${totalFinal.toLocaleString('es-AR')}</span>
          </div>
          
          <button 
             onClick={handleCheckout} 
             disabled={isProcessing || shippingCost === null}
             className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
          >
            {isProcessing ? 'Procesando...' : shippingCost === null ? 'Calcula el envío primero' : 'Finalizar Compra'}
          </button>
          
          <div className="mt-4 flex justify-between items-center">
             <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-primary underline">Seguir comprando</button>
             <button onClick={() => setIsClearModalOpen(true)} className="text-sm text-red-400 hover:text-red-600">Vaciar</button>
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