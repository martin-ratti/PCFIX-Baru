import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

// Helpers
const getImg = (text: string) => `https://placehold.co/600x600/111626/F2F2F2?text=${encodeURIComponent(text)}`;
const getBanner = (text: string) => `https://placehold.co/1200x400/1d4ed8/ffffff?text=${encodeURIComponent(text)}`;
const getLogo = (text: string) => `https://placehold.co/200x200/ffffff/000000?text=${encodeURIComponent(text)}`;

async function main() {
  console.log('🌱 Iniciando seed maestro sincronizado...');

  // 1. CONFIGURACIÓN
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {
        nombreBanco: "Banco Galicia",
        titular: "PCFIX S.R.L.",
        cbu: "0070000000000000000000",
        alias: "PCFIX.PAGOS",
        costoEnvioFijo: 5000,
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

  // ==========================================
  //  2. DEFINICIÓN MAESTRA DE SERVICIOS
  // ==========================================
  const serviciosMaestros = [
    { 
        title: "Armado de PC", 
        price: 45000, 
        description: "Ensamblaje profesional de componentes, gestión de cables premium y testeo de estrés." 
    },
    { 
        title: "Formateo Completo", 
        price: 25000, 
        description: "Instalación limpia de sistema operativo, drivers actualizados, antivirus y paquete Office." 
    },
    { 
        title: "Mantenimiento Preventivo", // CORREGIDO
        price: 20000, 
        description: "Limpieza profunda de hardware, cambio de pasta térmica (Arctic/Thermal Grizzly) y optimización de flujo de aire." 
    },
    { 
        title: "Diagnóstico", 
        price: 10000, 
        description: "Detección de fallas de hardware o software. El costo se bonifica al 100% si realizas la reparación con nosotros." 
    },
  ];

  // 3. CREAR/ACTUALIZAR EN TABLA ServiceItem (Web Pública)
  console.log('🛠️ Sincronizando Web Services...');
  for (const s of serviciosMaestros) {
    const exists = await prisma.serviceItem.findFirst({ where: { title: s.title }});
    if (!exists) {
        await prisma.serviceItem.create({ data: s });
    } else {
        await prisma.serviceItem.update({ where: { id: exists.id }, data: { price: s.price, description: s.description } });
    }
  }

  // 4. USUARIOS & CLIENTES
  console.log('👤 Creando usuarios...');
  const passwordAdmin = await bcrypt.hash('administrador', 10);
  const passwordUser = await bcrypt.hash('123456', 10);
  const passwordMostrador = await bcrypt.hash('mostrador123', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: passwordAdmin, role: 'ADMIN', nombre: 'Super', apellido: 'Admin' },
    create: { email: 'admin@gmail.com', nombre: 'Super', apellido: 'Admin', password: passwordAdmin, role: 'ADMIN' },
  });
  
  // Cliente
  await prisma.user.upsert({
    where: { email: 'martin@gmail.com' },
    update: { password: passwordUser, role: 'USER' },
    create: { email: 'martin@gmail.com', nombre: 'Martin', apellido: 'Cliente', password: passwordUser, role: 'USER' },
  });
  
  // Mostrador POS
  const mostrador = await prisma.user.upsert({
    where: { email: 'mostrador@pcfix.com' },
    update: {},
    create: { email: 'mostrador@pcfix.com', nombre: 'Cliente', apellido: 'Mostrador', password: passwordMostrador, role: 'USER' },
  });
  const perfilMostrador = await prisma.cliente.findUnique({ where: { userId: mostrador.id } });
  if (!perfilMostrador) await prisma.cliente.create({ data: { userId: mostrador.id } });


  // 5. CATEGORÍAS
  console.log('📂 Creando categorías...');
  const categoriesMap = new Map<string, number>();

  // Categoría "Servicios" (Necesaria para el POS)
  let catServicios = await prisma.categoria.findUnique({ where: { nombre: 'Servicios' } });
  if (!catServicios) {
      catServicios = await prisma.categoria.create({ data: { nombre: 'Servicios' } });
  }
  categoriesMap.set('Servicios', catServicios.id);

  // Categorías Regulares
  const catsData = [
    { name: 'Componentes', subs: ['Procesadores', 'Placas de Video', 'Motherboards', 'Memorias RAM', 'Almacenamiento'] },
    { name: 'Periféricos', subs: ['Mouses', 'Teclados', 'Auriculares', 'Monitores', 'Sillas Gamer'] },
    { name: 'Conectividad', subs: ['Routers', 'Placas WiFi'] }
  ];
  for (const parent of catsData) {
      const p = await prisma.categoria.upsert({ where: { nombre: parent.name }, update: {}, create: { nombre: parent.name } });
      categoriesMap.set(parent.name, p.id);
      for (const sub of parent.subs) {
          const s = await prisma.categoria.upsert({ where: { nombre: sub }, update: {}, create: { nombre: sub, padreId: p.id } });
          categoriesMap.set(sub, s.id);
      }
  }

  // 6. MARCAS
  const brandsData = ['Logitech', 'Razer', 'Corsair', 'HyperX', 'ASUS', 'MSI', 'AMD', 'Intel', 'NVIDIA', 'Redragon'];
  const brandsMap = new Map<string, number>();
  for (const b of brandsData) {
    const brand = await prisma.marca.upsert({ where: { nombre: b }, update: {}, create: { nombre: b, logo: getLogo(b) } });
    brandsMap.set(b, brand.id);
  }

  // 7. CREAR SERVICIOS COMO PRODUCTOS (Sincronizados para POS)
  console.log('🛠️ Sincronizando Productos POS...');
  
  for (const s of serviciosMaestros) {
      // GENERACIÓN DE NOMBRE AUTOMÁTICA: "Servicio: Mantenimiento Preventivo"
      const productName = `Servicio: ${s.title}`; 
      
      const exists = await prisma.producto.findFirst({ where: { nombre: productName } });
      
      const productData = {
          nombre: productName,
          descripcion: "Servicio técnico realizado en el local.",
          precio: s.price, // Mismo precio que la lista pública
          stock: 999999,
          categoriaId: catServicios.id,
          foto: "https://placehold.co/600x600/2563eb/FFF?text=Servicio",
          peso: 0,
          isFeatured: false
      };

      if (!exists) {
          await prisma.producto.create({ data: productData });
      } else {
          await prisma.producto.update({
              where: { id: exists.id },
              data: { precio: s.price }
          });
      }
  }

  // 8. PRODUCTOS FÍSICOS
  console.log('📦 Creando productos físicos...');
  const products = [
    { nombre: 'Procesador AMD Ryzen 9 7950X', cat: 'Procesadores', brand: 'AMD', price: 650000, stock: 10, weight: 0.5 },
    { nombre: 'Placa de Video MSI RTX 4090 Gaming X', cat: 'Placas de Video', brand: 'MSI', price: 2500000, stock: 3, weight: 2.5 },
    { nombre: 'Mouse Logitech G Pro X Superlight', cat: 'Mouses', brand: 'Logitech', price: 150000, stock: 50, weight: 0.3 },
    { nombre: 'Teclado Corsair K70 RGB', cat: 'Teclados', brand: 'Corsair', price: 180000, stock: 20, weight: 1.2 },
    { nombre: 'Auriculares HyperX Cloud II', cat: 'Auriculares', brand: 'HyperX', price: 95000, stock: 30, weight: 0.8 },
    { nombre: 'Monitor ASUS ROG Swift 360Hz', cat: 'Monitores', brand: 'ASUS', price: 850000, stock: 5, weight: 8.0 }
  ];

  for (const p of products) {
      const catId = categoriesMap.get(p.cat);
      const brandId = brandsMap.get(p.brand);
      if (catId && brandId) {
          const exists = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
          if (!exists) {
              await prisma.producto.create({
                  data: {
                      nombre: p.nombre,
                      descripcion: `Descripción de ${p.nombre}`,
                      precio: p.price,
                      stock: p.stock,
                      foto: getImg(p.brand + ' ' + p.cat),
                      categoriaId: catId,
                      marcaId: brandId,
                      peso: p.weight,
                      isFeatured: true
                  }
              });
          }
      }
  }

  // 9. BANNERS
  const bannerBrands = ['Logitech', 'MSI'];
  for (const bName of bannerBrands) {
      const brandId = brandsMap.get(bName);
      if (brandId) {
          const count = await prisma.banner.count({ where: { marcaId: brandId } });
          if (count === 0) {
              await prisma.banner.create({
                  data: { imagen: getBanner(`Ofertas ${bName}`), marcaId: brandId }
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