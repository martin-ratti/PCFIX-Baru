import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Necesario para encriptar las claves

const prisma = new PrismaClient();

// Helper para imágenes rápidas
const getImg = (text: string) => `https://placehold.co/600x600/111626/F2F2F2?text=${text}`;

async function main() {
  console.log('🌱 Iniciando seed...');

  // ==========================================
  // 1. USUARIOS (Admin y User)
  // ==========================================
  console.log('👤 Sembrando usuarios...');

  // Hasheamos las contraseñas
  const passwordAdmin = await bcrypt.hash('administrador', 10);
  const passwordUser = await bcrypt.hash('123456', 10);

  const usersData = [
    {
      email: 'admin@gmail.com',
      nombre: 'Super',
      apellido: 'Admin',
      password: passwordAdmin,
      role: 'ADMIN',
    },
    {
      email: 'martin@gmail.com',
      nombre: 'Martin',
      apellido: 'Cliente',
      password: passwordUser,
      role: 'USER',
    }
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // Si ya existe, no lo tocamos
      create: {
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        password: user.password,
        role: user.role as any, // Casteo para que TS no se queje del Enum
      },
    });
    console.log(`   -> Usuario listo: ${user.email} [${user.role}]`);
  }

  // ==========================================
  // 2. CATEGORÍAS
  // ==========================================
  console.log('wd Sembrando categorías...');
  
  const catsData = [
    { nombre: 'Procesadores' },
    { nombre: 'Placas de Video' },
    { nombre: 'Memorias RAM' },
    { nombre: 'Almacenamiento' },
    { nombre: 'Periféricos' },
    { nombre: 'Gabinetes' },
    { nombre: 'Monitores' },
    { nombre: 'Motherboards' },
    { nombre: 'Fuentes' },
  ];

  const categoriesMap = new Map<string, number>();

  for (const cat of catsData) {
    const created = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
    categoriesMap.set(cat.nombre, created.id);
  }
  console.log(`   -> ${catsData.length} categorías listas.`);

  // ==========================================
  // 3. PRODUCTOS
  // ==========================================
  console.log('📦 Sembrando productos...');

  const productsData = [
    // Destacados
    { nombre: 'Procesador Ryzen 9', categoria: 'Procesadores', precio: 450000, stock: 15, foto: getImg('CPU'), descripcion: 'Un procesador de última generación con 12 núcleos y 24 hilos.' },
    { nombre: 'Placa de Video RTX 4080', categoria: 'Placas de Video', precio: 1200000, stock: 5, foto: getImg('GPU'), descripcion: 'Experimenta el trazado de rayos en tiempo real.' },
    { nombre: 'Gabinete ATX Premium', categoria: 'Gabinetes', precio: 110000, stock: 30, foto: getImg('CASE'), descripcion: 'Diseño elegante con flujo de aire optimizado.' },
    { nombre: 'Monitor Ultrawide 34"', categoria: 'Monitores', precio: 750000, stock: 12, foto: getImg('MONITOR'), descripcion: 'Sumérgete en tus juegos y películas.' },
    { nombre: 'Teclado Mecánico RGB', categoria: 'Periféricos', precio: 85000, stock: 50, foto: getImg('KEYBOARD'), descripcion: 'Switches mecánicos para una respuesta táctil superior.' },
    { nombre: 'Motherboard B550M', categoria: 'Motherboards', precio: 150000, stock: 25, foto: getImg('MOBO'), descripcion: 'Motherboard robusta con soporte para PCIe 4.0.' },
    
    // Ofertas
    { nombre: 'SSD NVMe 1TB', categoria: 'Almacenamiento', precio: 100000, stock: 40, foto: getImg('SSD'), descripcion: 'Velocidades de lectura/escritura ultrarrápidas.' },
    { nombre: 'Memoria RAM 16GB DDR4', categoria: 'Memorias RAM', precio: 75000, stock: 100, foto: getImg('RAM'), descripcion: 'Para un multitasking fluido y sin interrupciones.' },
    { nombre: 'Mouse Gamer Pro', categoria: 'Periféricos', precio: 60000, stock: 20, foto: getImg('MOUSE'), descripcion: 'Sensor óptico de alta precisión.' },
    { nombre: 'Fuente 750W Gold', categoria: 'Fuentes', precio: 130000, stock: 18, foto: getImg('PSU'), descripcion: 'Eficiencia energética superior.' },
    
    // Carrusel Custom
    { nombre: 'Auriculares 7.1 Surround', categoria: 'Periféricos', precio: 92000, stock: 22, foto: getImg('HEADSET'), descripcion: 'Sonido envolvente 7.1 para inmersión total.' },
    { nombre: 'Webcam 1080p Pro', categoria: 'Periféricos', precio: 55000, stock: 35, foto: getImg('WEBCAM'), descripcion: 'Calidad de video Full HD 1080p.' },
  ];

  for (const p of productsData) {
    const catId = categoriesMap.get(p.categoria);
    
    if (catId) {
      await prisma.producto.create({
        data: {
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          stock: p.stock,
          foto: p.foto,
          categoriaId: catId
        }
      }).catch(() => {
        // Ignoramos error si ya existe (para no ensuciar la consola en re-seeds)
      });
    }
  }
  console.log(`   -> Productos listos.`);

  console.log('✅ Seed completado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });