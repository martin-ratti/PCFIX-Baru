// NOTA PARA EL FUTURO:
// Este archivo simula los datos que recibiremos de la API del backend.
// Las estructuras 'featuredProducts', 'saleProducts' y 'customCarousel'
// serán reemplazadas por llamadas fetch a sus respectivos endpoints.

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Precio original para productos en oferta
  imageUrl: string;
  imageAlt: string;
}

// --- Productos Destacados ---
export const featuredProducts: Product[] = [
  { id: '1', name: 'Procesador Ryzen 9', price: 450000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=CPU', imageAlt: 'Imagen de un procesador' },
  { id: '2', name: 'Placa de Video RTX 4080', price: 1200000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=GPU', imageAlt: 'Imagen de una placa de video' },
  { id: '3', name: 'Gabinete ATX Premium', price: 110000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=CASE', imageAlt: 'Imagen de un gabinete' },
  { id: '4', name: 'Monitor Ultrawide 34"', price: 750000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=MONITOR', imageAlt: 'Imagen de un monitor' },
  { id: '5', name: 'Teclado Mecánico RGB', price: 85000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=KEYBOARD', imageAlt: 'Imagen de un teclado' },
];

// --- Productos en Oferta ---
export const saleProducts: Product[] = [
  { id: '6', name: 'SSD NVMe 1TB', price: 100000, originalPrice: 120000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=SSD', imageAlt: 'Imagen de un SSD' },
  { id: '7', name: 'Memoria RAM 16GB DDR4', price: 75000, originalPrice: 95000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=RAM', imageAlt: 'Imagen de una memoria RAM' },
  { id: '8', name: 'Mouse Gamer Pro', price: 60000, originalPrice: 75000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=MOUSE', imageAlt: 'Imagen de un mouse gamer' },
  { id: '9', name: 'Fuente 750W Gold', price: 130000, originalPrice: 150000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=PSU', imageAlt: 'Imagen de una fuente de poder' },
];

// --- Carrusel Personalizado por el Administrador ---
export const customCarousel = {
  title: "Lo Más Nuevo en Periféricos",
  products: [
    { id: '5', name: 'Teclado Mecánico RGB', price: 85000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=KEYBOARD', imageAlt: 'Imagen de un teclado' },
    { id: '8', name: 'Mouse Gamer Pro', price: 60000, originalPrice: 75000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=MOUSE', imageAlt: 'Imagen de un mouse gamer' },
    { id: '10', name: 'Auriculares 7.1 Surround', price: 92000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=HEADSET', imageAlt: 'Imagen de auriculares gamer' },
    { id: '11', name: 'Webcam 1080p Pro', price: 55000, imageUrl: 'https://via.placeholder.com/300x300.png/111626/F2F2F2?text=WEBCAM', imageAlt: 'Imagen de una webcam' },
  ]
};