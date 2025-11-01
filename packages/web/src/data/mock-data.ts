// NOTA PARA EL FUTURO:
// Este archivo simula los datos que recibiremos de la API.
// La estructura de 'Product' y los datos serán reemplazados por llamadas a la API.

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  stock: number;
  isFeatured?: boolean;
}

// --- Productos Destacados ---
export const featuredProducts: Product[] = [
  { id: '1', name: 'Procesador Ryzen 9', slug: 'procesador-ryzen-9', price: 450000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=CPU', imageAlt: 'Imagen de un procesador', description: 'Un procesador de última generación con 12 núcleos y 24 hilos, ideal para gaming y productividad extrema.', stock: 15, isFeatured: true },
  { id: '2', name: 'Placa de Video RTX 4080', slug: 'placa-de-video-rtx-4080', price: 1200000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=GPU', imageAlt: 'Imagen de una placa de video', description: 'Experimenta el trazado de rayos en tiempo real y el rendimiento de IA con la NVIDIA GeForce RTX 4080.', stock: 5, isFeatured: true },
  { id: '3', name: 'Gabinete ATX Premium', slug: 'gabinete-atx-premium', price: 110000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=CASE', imageAlt: 'Imagen de un gabinete', description: 'Diseño elegante con flujo de aire optimizado y paneles de vidrio templado para mostrar tus componentes.', stock: 30 },
  { id: '4', name: 'Monitor Ultrawide 34"', slug: 'monitor-ultrawide-34', price: 750000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=MONITOR', imageAlt: 'Imagen de un monitor', description: 'Sumérgete en tus juegos y películas con este monitor curvo de 34 pulgadas y resolución QHD.', stock: 12 },
  { id: '5', name: 'Teclado Mecánico RGB', slug: 'teclado-mecanico-rgb', price: 85000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=KEYBOARD', imageAlt: 'Imagen de un teclado', description: 'Switches mecánicos para una respuesta táctil superior y retroiluminación RGB personalizable.', stock: 50 },
  { id: '12', name: 'Motherboard B550M', slug: 'motherboard-b550m', price: 150000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=MOBO', imageAlt: 'Imagen de una motherboard', description: 'Motherboard robusta con soporte para PCIe 4.0 y múltiples conectores M.2.', stock: 25, isFeatured: true },
];

// --- Productos en Oferta ---
export const saleProducts: Product[] = [
  { id: '6', name: 'SSD NVMe 1TB', slug: 'ssd-nvme-1tb', price: 100000, originalPrice: 120000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=SSD', imageAlt: 'Imagen de un SSD', description: 'Reduce drásticamente los tiempos de carga con velocidades de lectura/escritura ultrarrápidas.', stock: 40 },
  { id: '7', name: 'Memoria RAM 16GB DDR4', slug: 'memoria-ram-16gb-ddr4', price: 75000, originalPrice: 95000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=RAM', imageAlt: 'Imagen de una memoria RAM', description: '16GB de RAM DDR4 a 3200MHz para un multitasking fluido y sin interrupciones.', stock: 100 },
  { id: '8', name: 'Mouse Gamer Pro', slug: 'mouse-gamer-pro', price: 60000, originalPrice: 75000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=MOUSE', imageAlt: 'Imagen de un mouse gamer', description: 'Sensor óptico de alta precisión, diseño ergonómico y botones programables para una ventaja competitiva.', stock: 0 },
  { id: '9', name: 'Fuente 750W Gold', slug: 'fuente-750w-gold', price: 130000, originalPrice: 150000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=PSU', imageAlt: 'Imagen de una fuente de poder', description: 'Certificación 80 Plus Gold para una eficiencia energética superior y componentes de alta calidad.', stock: 18 },
];

// --- Carrusel Personalizado por el Administrador ---
export const customCarousel = {
  title: "Lo Más Nuevo en Periféricos",
  products: [
    { id: '5', name: 'Teclado Mecánico RGB', slug: 'teclado-mecanico-rgb', price: 85000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=KEYBOARD', imageAlt: 'Imagen de un teclado', description: 'Switches mecánicos para una respuesta táctil superior y retroiluminación RGB personalizable.', stock: 50 },
    { id: '8', name: 'Mouse Gamer Pro', slug: 'mouse-gamer-pro', price: 60000, originalPrice: 75000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=MOUSE', imageAlt: 'Imagen de un mouse gamer', description: 'Sensor óptico de alta precisión, diseño ergonómico y botones programables para una ventaja competitiva.', stock: 0 },
    { id: '10', name: 'Auriculares 7.1 Surround', slug: 'auriculares-7-1-surround', price: 92000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=HEADSET', imageAlt: 'Imagen de auriculares gamer', description: 'Sonido envolvente 7.1 para una inmersión total en el juego y micrófono con cancelación de ruido.', stock: 22 },
    { id: '11', name: 'Webcam 1080p Pro', slug: 'webcam-1080p-pro', price: 55000, imageUrl: 'https://via.placeholder.com/600x600.png/111626/F2F2F2?text=WEBCAM', imageAlt: 'Imagen de una webcam', description: 'Calidad de video Full HD 1080p para streaming y videollamadas profesionales.', stock: 35 },
  ]
};

// --- Combinamos todos los productos para la búsqueda ---
export const allProducts: Product[] = [
  ...featuredProducts, 
  ...saleProducts.filter(p => !featuredProducts.find(fp => fp.id === p.id)),
  ...customCarousel.products.filter(p => !featuredProducts.find(fp => fp.id === p.id) && !saleProducts.find(sp => sp.id === p.id))
];