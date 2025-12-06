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

const getImg = (text: string) => `https://placehold.co/600x600/111626/F2F2F2?text=${text}`;

export const featuredProducts: Product[] = [
  { id: '1', name: 'Procesador Ryzen 9', slug: 'procesador-ryzen-9', price: 450000, imageUrl: getImg('CPU'), imageAlt: 'Imagen de un procesador', description: 'Potencia pura.', stock: 15, isFeatured: true },
  { id: '2', name: 'Placa de Video RTX 4080', slug: 'placa-de-video-rtx-4080', price: 1200000, imageUrl: getImg('GPU'), imageAlt: 'Imagen de una placa de video', description: 'Gráficos ultra realistas.', stock: 5, isFeatured: true },
  { id: '3', name: 'Gabinete ATX Premium', slug: 'gabinete-atx-premium', price: 110000, imageUrl: getImg('CASE'), imageAlt: 'Imagen de un gabinete', description: 'Flujo de aire optimizado.', stock: 30 },
  { id: '4', name: 'Monitor Ultrawide 34"', slug: 'monitor-ultrawide-34', price: 750000, imageUrl: getImg('MONITOR'), imageAlt: 'Imagen de un monitor', description: 'Inmersión total.', stock: 12 },
  { id: '5', name: 'Teclado Mecánico RGB', slug: 'teclado-mecanico-rgb', price: 85000, imageUrl: getImg('KEYBOARD'), imageAlt: 'Imagen de un teclado', description: 'Switches mecánicos.', stock: 50 },
  { id: '12', name: 'Motherboard B550M', slug: 'motherboard-b550m', price: 150000, imageUrl: getImg('MOBO'), imageAlt: 'Imagen de una motherboard', description: 'Base sólida.', stock: 25, isFeatured: true },
];

export const saleProducts: Product[] = [
  { id: '6', name: 'SSD NVMe 1TB', slug: 'ssd-nvme-1tb', price: 100000, originalPrice: 120000, imageUrl: getImg('SSD'), imageAlt: 'SSD', description: 'Velocidad extrema.', stock: 40 },
  { id: '7', name: 'Memoria RAM 16GB', slug: 'memoria-ram-16gb-ddr4', price: 75000, originalPrice: 95000, imageUrl: getImg('RAM'), imageAlt: 'RAM', description: 'Multitasking fluido.', stock: 100 },
  { id: '8', name: 'Mouse Gamer Pro', slug: 'mouse-gamer-pro', price: 60000, originalPrice: 75000, imageUrl: getImg('MOUSE'), imageAlt: 'Mouse', description: 'Precisión milimétrica.', stock: 0 },
  { id: '9', name: 'Fuente 750W Gold', slug: 'fuente-750w-gold', price: 130000, originalPrice: 150000, imageUrl: getImg('PSU'), imageAlt: 'Fuente', description: 'Energía estable.', stock: 18 },
];

export const customCarousel = {
  title: "Lo Más Nuevo en Periféricos",
  products: [
    { id: '5', name: 'Teclado Mecánico RGB', slug: 'teclado-mecanico-rgb', price: 85000, imageUrl: getImg('KEYBOARD'), imageAlt: 'Teclado', description: 'RGB.', stock: 50 },
    { id: '8', name: 'Mouse Gamer Pro', slug: 'mouse-gamer-pro', price: 60000, originalPrice: 75000, imageUrl: getImg('MOUSE'), imageAlt: 'Mouse', description: 'Gamer.', stock: 0 },
    { id: '10', name: 'Auriculares 7.1', slug: 'auriculares-7-1-surround', price: 92000, imageUrl: getImg('HEADSET'), imageAlt: 'Auriculares', description: 'Sonido 7.1.', stock: 22 },
    { id: '11', name: 'Webcam 1080p Pro', slug: 'webcam-1080p-pro', price: 55000, imageUrl: getImg('WEBCAM'), imageAlt: 'Webcam', description: 'Full HD.', stock: 35 },
  ]
};

export const allProducts: Product[] = [
  ...featuredProducts,
  ...saleProducts.filter(p => !featuredProducts.find(fp => fp.id === p.id)),
  ...customCarousel.products.filter(p => !featuredProducts.find(fp => fp.id === p.id) && !saleProducts.find(sp => sp.id === p.id))
];