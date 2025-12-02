import React from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore'; // Importar Auth
import { navigate } from 'astro:transitions/client';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    imageAlt: string;
    stock: number;
    slug: string;
    description?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore();
  const { user } = useAuthStore(); // Obtenemos el usuario
  
  const isAdmin = user?.role === 'ADMIN'; // Flag de control
  const itemInCart = items.find((item) => item.id === product.id);

  // Lógica de Cliente
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addItem({
        ...product,
        description: product.description || '',
        slug: product.slug || product.id
      });
      await navigate('/carrito');
    }
  };

  // Lógica de Admin - Eliminar
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        const res = await fetch(`http://localhost:3002/api/products/${product.id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        
        if (data.success) {
          alert('Producto eliminado');
          window.location.reload(); // Recargamos para ver cambios
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Error de red al eliminar');
      }
    }
  };

  // Lógica de Admin - Editar
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitamos ir al detalle, vamos al edit
    e.stopPropagation();
    navigate(`/admin/editar/${product.id}`);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl h-full flex flex-col hover:shadow-2xl transition-shadow duration-300 relative">
      
      {/* Badge de Admin (Opcional, para identificar visualmente) */}
      {isAdmin && (
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10 opacity-80">
          ID: {product.id}
        </div>
      )}

      <a href={`/producto/${product.id}`} className="block relative group">
        <div className="overflow-hidden">
            <img 
                className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500" 
                src={product.imageUrl} 
                alt={product.imageAlt} 
            />
        </div>
      </a>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-secondary flex-grow mb-2 hover:text-primary transition-colors">
          <a href={`/producto/${product.id}`}>{product.name}</a>
        </h3>
        
        <div className="mt-auto">
          <div className="mb-4">
             <p className="text-xl font-black text-primary">${product.price.toLocaleString('es-AR')}</p>
             <p className="text-xs text-muted">Stock: {product.stock}</p>
          </div>

          {/* RENDERIZADO CONDICIONAL: ADMIN vs USUARIO */}
          {isAdmin ? (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-600 text-white font-bold py-2 px-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-100 text-red-600 font-bold py-2 px-2 rounded text-sm hover:bg-red-200 transition-colors border border-red-200"
              >
                Eliminar
              </button>
            </div>
          ) : (
            /* Bloque de Usuario Normal (Carrito) */
            !itemInCart ? (
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-primary text-light font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
              >
                {product.stock > 0 ? 'Agregar y Comprar' : 'Sin Stock'}
              </button>
            ) : (
              <div className="flex items-center justify-center border border-muted rounded-lg bg-gray-50">
                <button onClick={() => decreaseQuantity(product.id)} className="px-4 py-2 text-lg font-bold hover:bg-gray-200 rounded-l-lg">-</button>
                <span className="px-5 py-2 text-lg font-bold text-primary">{itemInCart.quantity}</span>
                <button onClick={() => increaseQuantity(product.id)} className="px-4 py-2 text-lg font-bold hover:bg-gray-200 rounded-r-lg">+</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}