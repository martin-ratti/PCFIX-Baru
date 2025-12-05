import { PrismaClient, VentaEstado } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

// Helpers
const getImg = (text: string) => `https://placehold.co/600x600/111626/F2F2F2?text=${encodeURIComponent(text)}`;
const getBanner = (text: string) => `https://placehold.co/1200x400/1d4ed8/ffffff?text=${encodeURIComponent(text)}`;
const getLogo = (text: string) => `https://placehold.co/200x200/ffffff/000000?text=${encodeURIComponent(text)}`;

// Helper Random Date
const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

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

  // 2. SERVICIOS TÉCNICOS
  console.log('🛠️ Sincronizando Web Services...');
  const serviciosMaestros = [
    { title: "Armado de PC", price: 45000, description: "Ensamblaje profesional..." },
    { title: "Formateo Completo", price: 25000, description: "Instalación limpia..." },
    { title: "Mantenimiento Preventivo", price: 20000, description: "Limpieza profunda..." },
    { title: "Diagnóstico", price: 10000, description: "Detección de fallas..." },
  ];

  for (const s of serviciosMaestros) {
    const exists = await prisma.serviceItem.findFirst({ where: { title: s.title }});
    if (!exists) {
        await prisma.serviceItem.create({ data: s });
    } else {
        await prisma.serviceItem.update({ where: { id: exists.id }, data: { price: s.price, description: s.description } });
    }
  }

  // 3. USUARIOS
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

  // Cliente Normal
  const clientUser = await prisma.user.upsert({
    where: { email: 'martin@gmail.com' },
    update: { password: passwordUser, role: 'USER' },
    create: { email: 'martin@gmail.com', nombre: 'Martin', apellido: 'Cliente', password: passwordUser, role: 'USER' },
  });
  
  // Cliente del Local
  const mostradorUser = await prisma.user.upsert({
    where: { email: 'mostrador@pcfix.com' },
    update: {},
    create: { email: 'mostrador@pcfix.com', nombre: 'Cliente', apellido: 'Mostrador', password: passwordMostrador, role: 'USER' },
  });
  
  // Perfiles de cliente (NECESARIOS para ventas)
  let perfilCliente = await prisma.cliente.findUnique({ where: { userId: clientUser.id } });
  if (!perfilCliente) perfilCliente = await prisma.cliente.create({ data: { userId: clientUser.id } });

  let perfilMostrador = await prisma.cliente.findUnique({ where: { userId: mostradorUser.id } });
  if (!perfilMostrador) perfilMostrador = await prisma.cliente.create({ data: { userId: mostradorUser.id } });


  // 4. CATEGORÍAS
  console.log('📂 Creando categorías...');
  const categoriesMap = new Map<string, number>();

  let catServicios = await prisma.categoria.findUnique({ where: { nombre: 'Servicios' } });
  if (!catServicios) {
      catServicios = await prisma.categoria.create({ data: { nombre: 'Servicios' } });
  }
  categoriesMap.set('Servicios', catServicios.id);

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

  // 5. MARCAS
  const brandsData = ['Logitech', 'Razer', 'Corsair', 'HyperX', 'ASUS', 'MSI', 'AMD', 'Intel', 'NVIDIA', 'Redragon'];
  const brandsMap = new Map<string, number>();
  for (const b of brandsData) {
    const brand = await prisma.marca.upsert({ where: { nombre: b }, update: {}, create: { nombre: b, logo: getLogo(b) } });
    brandsMap.set(b, brand.id);
  }

  // 6. SERVICIOS (POS)
  console.log('🛠️ Sincronizando Productos POS...');
  for (const s of serviciosMaestros) {
      const productName = `Servicio: ${s.title}`; 
      const exists = await prisma.producto.findFirst({ where: { nombre: productName } });
      const productData = {
          nombre: productName,
          descripcion: "Servicio técnico realizado en el local.",
          precio: s.price,
          stock: 99999,
          categoriaId: catServicios.id,
          foto: "https://placehold.co/600x600/2563eb/FFF?text=Servicio",
          peso: 0,
          isFeatured: false
      };
      if (!exists) await prisma.producto.create({ data: productData });
      else await prisma.producto.update({ where: { id: exists.id }, data: { precio: s.price } });
  }

  // 7. PRODUCTOS FÍSICOS
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

  // 8. BANNERS
  const bannerBrands = ['Logitech', 'MSI'];
  for (const bName of bannerBrands) {
      const brandId = brandsMap.get(bName);
      if (brandId) {
          const count = await prisma.banner.count({ where: { marcaId: brandId } });
          if (count === 0) await prisma.banner.create({ data: { imagen: getBanner(`Ofertas ${bName}`), marcaId: brandId } });
      }
  }

  // =========================================================
  // 10. VENTAS HISTÓRICAS (MOCK DATA PARA EL GRÁFICO)
  // =========================================================
  console.log('📊 Generando historial de ventas...');
  
  // Limpiamos ventas viejas para no duplicar en cada seed si quieres (opcional)
  // await prisma.lineaVenta.deleteMany({});
  // await prisma.venta.deleteMany({});

  const allProducts = await prisma.producto.findMany();
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  // Generamos 50 ventas aleatorias
  for (let i = 0; i < 50; i++) {
      const isService = Math.random() > 0.7; // 30% prob de ser servicio
      const randomProd = allProducts[Math.floor(Math.random() * allProducts.length)];
      const fechaVenta = randomDate(sixMonthsAgo, today);
      const cantidad = Math.floor(Math.random() * 2) + 1;
      const total = Number(randomProd.precio) * cantidad;
      
      // Alternamos entre cliente web y mostrador
      const clienteId = Math.random() > 0.5 ? perfilCliente.id : perfilMostrador.id;
      const metodoPago = Math.random() > 0.5 ? 'TRANSFERENCIA' : (Math.random() > 0.5 ? 'EFECTIVO' : 'BINANCE');

      await prisma.venta.create({
          data: {
              clienteId: clienteId,
              montoTotal: total,
              fecha: fechaVenta,
              estado: VentaEstado.APROBADO, // Aprobado para que salga en el gráfico
              medioPago: metodoPago,
              tipoEntrega: 'RETIRO',
              costoEnvio: 0,
              lineasVenta: {
                  create: {
                      productoId: randomProd.id,
                      cantidad: cantidad,
                      subTotal: total
                  }
              }
          }
      });
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