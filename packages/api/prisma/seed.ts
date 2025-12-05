import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process'; // Necesario para evitar errores de TS en algunos entornos

const prisma = new PrismaClient();

// Helpers para generar imágenes de placeholder bonitas
const getImg = (text: string) => `https://placehold.co/600x600/111626/F2F2F2?text=${encodeURIComponent(text)}`;
const getBanner = (text: string) => `https://placehold.co/1200x400/1d4ed8/ffffff?text=${encodeURIComponent(text)}`;
const getLogo = (text: string) => `https://placehold.co/200x200/ffffff/000000?text=${encodeURIComponent(text)}`;

async function main() {
  console.log('🌱 Iniciando seed maestro...');

// 1. CONFIGURACIÓN (Con Binance y Local)
  console.log('⚙️ Configurando tienda...');
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {
        nombreBanco: "Banco Galicia",
        titular: "PCFIX S.R.L.",
        cbu: "0070000000000000000000",
        alias: "PCFIX.PAGOS",
        costoEnvioFijo: 5000,
        // Nuevos campos
        binanceAlias: "PCFIX.CRYPTO",
        binanceCbu: "556677889 (Pay ID)",
        direccionLocal: "Av. Corrientes 4567, Almagro, CABA",
        horariosLocal: "Lunes a Viernes 10:00 - 18:30hs"
    },
    create: {
        nombreBanco: "Banco Galicia",
        titular: "PCFIX S.R.L.",
        cbu: "0070000000000000000000",
        alias: "PCFIX.PAGOS",
        costoEnvioFijo: 5000,
        binanceAlias: "PCFIX.CRYPTO",
        binanceCbu: "556677889 (Pay ID)",
        direccionLocal: "Av. Corrientes 4567, Almagro, CABA",
        horariosLocal: "Lunes a Viernes 10:00 - 18:30hs"
    }
  });

  // 2. SERVICIOS TÉCNICOS
  console.log('🛠️ Creando Servicios Técnicos...');
  const servicios = [
    { title: "Armado de PC", price: 45000, description: "Ensamblaje profesional de componentes, gestión de cables premium y testeo de estrés." },
    { title: "Formateo Completo", price: 25000, description: "Instalación limpia de sistema operativo, drivers actualizados, antivirus y paquete Office." },
    { title: "Mantenimiento Preventivo", price: 20000, description: "Limpieza profunda de hardware, cambio de pasta térmica (Arctic/Thermal Grizzly) y optimización de flujo de aire." },
    { title: "Diagnóstico", price: 10000, description: "Detección de fallas de hardware o software. El costo se bonifica al 100% si realizas la reparación con nosotros." },
  ];

  for (const s of servicios) {
    const exists = await prisma.serviceItem.findFirst({ where: { title: s.title }});
    if (!exists) {
        await prisma.serviceItem.create({ data: s });
    } else {
        await prisma.serviceItem.update({ where: { id: exists.id }, data: { price: s.price, description: s.description } });
    }
  }
// 2. USUARIOS
  console.log('👤 Creando/Actualizando usuarios...');
  const passwordAdmin = await bcrypt.hash('administrador', 10);
  const passwordUser = await bcrypt.hash('123456', 10);

  // CORRECCIÓN: Actualizamos password y rol también en el 'update'
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { 
        password: passwordAdmin, 
        role: 'ADMIN',
        nombre: 'Super',
        apellido: 'Admin'
    },
    create: { 
        email: 'admin@gmail.com', 
        nombre: 'Super', 
        apellido: 'Admin', 
        password: passwordAdmin, 
        role: 'ADMIN' 
    },
  });

  const clienteUser = await prisma.user.upsert({
    where: { email: 'martin@gmail.com' },
    update: { 
        password: passwordUser,
        role: 'USER'
    },
    create: { 
        email: 'martin@gmail.com', 
        nombre: 'Martin', 
        apellido: 'Cliente', 
        password: passwordUser, 
        role: 'USER' 
    },
  });
  // Crear perfil de cliente para que pueda comprar directo
  if (clienteUser) {
      const cliente = await prisma.cliente.findUnique({ where: { userId: clienteUser.id } });
      if (!cliente) await prisma.cliente.create({ data: { userId: clienteUser.id } });
  }

  // 3. MARCAS
  console.log('🏷️ Creando marcas...');
  const brandsData = ['Logitech', 'Razer', 'Corsair', 'HyperX', 'ASUS', 'MSI', 'AMD', 'Intel', 'NVIDIA', 'Redragon'];
  const brandsMap = new Map<string, number>();

  for (const b of brandsData) {
    const brand = await prisma.marca.upsert({
        where: { nombre: b },
        update: {},
        create: { nombre: b, logo: getLogo(b) }
    });
    brandsMap.set(b, brand.id);
  }

  // 4. CATEGORÍAS (Con Jerarquía)
  console.log('📂 Creando categorías...');
  const catsData = [
    { name: 'Componentes', subs: ['Procesadores', 'Placas de Video', 'Motherboards', 'Memorias RAM', 'Almacenamiento'] },
    { name: 'Periféricos', subs: ['Mouses', 'Teclados', 'Auriculares', 'Monitores', 'Sillas Gamer'] },
    { name: 'Conectividad', subs: ['Routers', 'Placas WiFi'] }
  ];

  const categoriesMap = new Map<string, number>();

  for (const parent of catsData) {
      const p = await prisma.categoria.upsert({
          where: { nombre: parent.name },
          update: {},
          create: { nombre: parent.name }
      });
      categoriesMap.set(parent.name, p.id);

      for (const sub of parent.subs) {
          const s = await prisma.categoria.upsert({
              where: { nombre: sub },
              update: {},
              create: { nombre: sub, padreId: p.id }
          });
          categoriesMap.set(sub, s.id);
      }
  }

  // 5. PRODUCTOS (Datos Completos para Envío)
  console.log('📦 Creando productos...');
  
  const products = [
    { 
        nombre: 'Procesador AMD Ryzen 9 7950X', 
        cat: 'Procesadores', brand: 'AMD', price: 650000, stock: 10, 
        featured: true, 
        weight: 0.5, height: 10, width: 10, depth: 5, 
        desc: 'El procesador más potente para gaming y creadores.' 
    },
    { 
        nombre: 'Placa de Video MSI RTX 4090 Gaming X', 
        cat: 'Placas de Video', brand: 'MSI', price: 2500000, stock: 3, 
        featured: true, 
        weight: 2.5, height: 15, width: 35, depth: 10,
        desc: 'Rendimiento extremo para 4K y Ray Tracing.' 
    },
    { 
        nombre: 'Mouse Logitech G Pro X Superlight', 
        cat: 'Mouses', brand: 'Logitech', price: 150000, stock: 50, 
        featured: false, 
        weight: 0.3, height: 8, width: 12, depth: 5,
        desc: 'El mouse más ligero y preciso para esports.' 
    },
    { 
        nombre: 'Teclado Corsair K70 RGB', 
        cat: 'Teclados', brand: 'Corsair', price: 180000, stock: 20, 
        featured: false, 
        weight: 1.2, height: 5, width: 45, depth: 15,
        desc: 'Teclas mecánicas Cherry MX y estructura de aluminio.' 
    },
    { 
        nombre: 'Auriculares HyperX Cloud II', 
        cat: 'Auriculares', brand: 'HyperX', price: 95000, stock: 30, 
        featured: true, originalPrice: 120000, // OFERTA
        weight: 0.8, height: 20, width: 20, depth: 10,
        desc: 'Sonido envolvente 7.1 y comodidad legendaria.' 
    },
    { 
        nombre: 'Monitor ASUS ROG Swift 360Hz', 
        cat: 'Monitores', brand: 'ASUS', price: 850000, stock: 5, 
        featured: true, 
        weight: 8.0, height: 50, width: 80, depth: 20,
        desc: 'La velocidad más rápida para competición profesional.' 
    }
  ];

  for (const p of products) {
      const catId = categoriesMap.get(p.cat);
      const brandId = brandsMap.get(p.brand);

      if (catId && brandId) {
          // Upsert para evitar duplicados si corres el seed varias veces
          // Usamos 'nombre' como key única temporal (aunque en la DB no lo sea estrictamente)
          // Para hacerlo simple, usamos create con try/catch o findFirst
          
          const exists = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
          
          if (!exists) {
              await prisma.producto.create({
                  data: {
                      nombre: p.nombre,
                      descripcion: p.desc,
                      precio: p.price,
                      precioOriginal: p.originalPrice,
                      stock: p.stock,
                      foto: getImg(p.brand + ' ' + p.cat),
                      categoriaId: catId,
                      marcaId: brandId,
                      isFeatured: p.featured,
                      // DATOS LOGÍSTICOS
                      peso: p.weight,
                      alto: p.height,
                      ancho: p.width,
                      profundidad: p.depth
                  }
              });
          }
      }
  }

  // 6. BANNERS
  console.log('🖼️ Creando banners...');
  const bannerBrands = ['Logitech', 'MSI'];
  for (const bName of bannerBrands) {
      const brandId = brandsMap.get(bName);
      if (brandId) {
          const count = await prisma.banner.count({ where: { marcaId: brandId } });
          if (count === 0) {
              await prisma.banner.create({
                  data: {
                      imagen: getBanner(`Ofertas ${bName}`),
                      marcaId: brandId
                  }
              });
          }
      }
  }

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