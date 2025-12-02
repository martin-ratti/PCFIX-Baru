import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { navigate } from 'astro:transitions/client';
import ConfirmModal from '../shared/ConfirmModal';

export default function CartView() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const isAdmin = user?.role === 'ADMIN';

  const handleIncrease = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      if (item.quantity >= item.stock) {
        addToast(`Solo hay ${item.stock} unidades disponibles`, 'error');
        return;
      }
      increaseQuantity(itemId);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      addToast('Inicia sesión para continuar con la compra', 'info');
      await navigate('/login');
      return;
    }
    // Aquí iría la lógica de POST /api/orders
    alert('¡Checkout en construcción!');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-center mb-4 text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Tu carrito está vacío</h1>
        <p className="text-muted mb-8">¡Explora nuestro catálogo y encuentra lo que buscas!</p>
        <button onClick={() => navigate('/')} className="bg-primary text-light font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors">
          Ir a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-secondary mb-6">Tu Carrito ({items.length})</h1>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center bg-white p-4 rounded-lg shadow-md gap-4 hover:shadow-lg transition-shadow duration-300">
                <a href={`/producto/${item.slug || item.id}`} className="shrink-0">
                  <img src={item.imageUrl} alt={item.imageAlt} className="w-24 h-24 object-cover rounded border border-gray-100" />
                </a>
                
                <div className="flex-grow text-center sm:text-left">
                  <h2 className="font-bold text-lg text-secondary hover:text-primary transition-colors">
                    <a href={`/producto/${item.slug || item.id}`}>{item.name}</a>
                  </h2>
                  <p className="text-primary font-semibold text-xl mt-1">${item.price.toLocaleString('es-AR')}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                    <button onClick={() => decreaseQuantity(item.id)} className="px-3 py-1 hover:bg-gray-200 transition-colors font-bold text-gray-600">-</button>
                    <span className="px-4 py-1 font-medium w-12 text-center">{item.quantity}</span>
                    <button onClick={() => handleIncrease(item.id)} className={`px-3 py-1 transition-colors font-bold ${item.quantity >= item.stock ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24 border border-gray-100">
            <h2 className="text-2xl font-bold text-secondary border-b pb-4 mb-4">Resumen</h2>
            <div className="flex justify-between mb-2 text-gray-600"><span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span></div>
            <div className="flex justify-between mb-4 text-gray-600"><span>Envío</span><span className="text-green-600 font-medium">Gratis</span></div>
            <div className="flex justify-between font-bold text-2xl border-t border-gray-200 pt-4 mt-4 text-primary"><span>Total</span><span>${subtotal.toLocaleString('es-AR')}</span></div>
            
            {isAdmin ? (
              <div className="mt-6 bg-gray-100 text-gray-500 font-bold py-3 px-4 rounded-lg text-center border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2">
                🚫 Modo Administrador
              </div>
            ) : (
              <button onClick={handleCheckout} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:shadow-green-300">
                {isAuthenticated ? 'Finalizar Compra' : 'Iniciar Sesión para Comprar'}
              </button>
            )}
            
            <button onClick={() => navigate('/')} className="w-full mt-3 border-2 border-primary text-primary font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors">Seguir Comprando</button>
            <button onClick={() => setIsClearModalOpen(true)} className="w-full mt-4 text-sm text-red-400 hover:text-red-600 hover:underline text-center">Vaciar Carrito</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Vaciar Carrito"
        message="¿Estás seguro de que deseas eliminar todos los productos del carrito?"
        confirmText="Sí, vaciar"
        isDanger={true}
        onConfirm={() => { clearCart(); setIsClearModalOpen(false); addToast('Carrito vaciado', 'info'); }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </>
  );
}