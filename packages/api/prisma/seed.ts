import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Base de Datos...');

  // --- 1. CONFIGURACIÓN DEL ADMIN (Vía Variables de Entorno) ---
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log(`👤 Configurando Admin Seguro (${adminEmail})...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'ADMIN', // Aseguramos que siga siendo admin si ya existe
        password: hashedPassword, // Actualizamos pass si cambió en el .env
      },
      create: {
        email: adminEmail,
        nombre: 'Admin',
        apellido: 'Sistema',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin configurado correctamente.');
  } else {
    console.warn('⚠️  ADMIN_EMAIL o ADMIN_PASSWORD no definidos. Se omitió la creación del admin.');
  }

  // --- 2. CLIENTE MOSTRADOR (Para ventas locales anónimas) ---
  console.log('👤 Configurando Cliente de Mostrador...');
  const passwordMostrador = await bcrypt.hash('Mostrador123!', 10);

  const mostradorUser = await prisma.user.upsert({
    where: { email: 'mostrador@pcfix.com' },
    update: {},
    create: {
      email: 'mostrador@pcfix.com',
      nombre: 'Cliente',
      apellido: 'Mostrador',
      password: passwordMostrador,
      role: 'USER'
    },
  });

  // Asegurar que tenga perfil de Cliente
  await prisma.cliente.upsert({
    where: { userId: mostradorUser.id },
    update: {},
    create: { userId: mostradorUser.id, direccion: 'Local', telefono: '0000000000' }
  });


  // --- 3. CATEGORÍA DE SERVICIOS (Necesaria para los productos POS) ---
  console.log('📂 Verificando Categoría Servicios...');
  const catServicios = await prisma.categoria.upsert({
    where: { nombre: 'Servicios' },
    update: {},
    create: { nombre: 'Servicios', padreId: null }
  });


  // --- 4. DATOS MAESTROS DE SERVICIOS ---
  const serviciosMaestros = [
    { title: "Armado de PC", price: 45000, description: "Ensamblaje profesional de componentes." },
    { title: "Formateo Completo", price: 25000, description: "Instalación limpia de SO y drivers." },
    { title: "Mantenimiento Preventivo", price: 20000, description: "Limpieza profunda y cambio de pasta térmica." },
    { title: "Diagnóstico", price: 10000, description: "Detección de fallas de hardware/software." },
  ];


  // --- 5. SERVICIOS TÉCNICOS (Tabla ServiceItem para Dashboard Técnico) ---
  console.log('🛠️ Sincronizando ServiceItems (Módulo Técnico)...');
  for (const s of serviciosMaestros) {
    const exists = await prisma.serviceItem.findFirst({ where: { title: s.title } });
    if (!exists) {
      await prisma.serviceItem.create({
        data: {
          title: s.title,
          price: s.price,
          description: s.description
        }
      });
    } else {
      await prisma.serviceItem.update({
        where: { id: exists.id },
        data: { price: s.price, description: s.description }
      });
    }
  }


  // --- 6. SERVICIOS POS (Tabla Producto para Carrito/Ventas) ---
  console.log('🛒 Sincronizando Productos POS (Catálogo)...');
  for (const s of serviciosMaestros) {
    const productName = `Servicio: ${s.title}`;
    const exists = await prisma.producto.findFirst({ where: { nombre: productName } });

    const productData = {
      nombre: productName,
      descripcion: s.description || "Servicio técnico realizado en el local.",
      precio: s.price,
      stock: 99999, // Stock infinito para servicios
      categoriaId: catServicios.id,
      foto: "https://res.cloudinary.com/demo/image/upload/v1680000000/service-placeholder.png", // Usa una URL válida o placeholder
      peso: 0,
      isFeatured: false
    };

    if (!exists) {
      await prisma.producto.create({ data: productData });
    } else {
      // Actualizamos precio si cambió en el array maestro
      await prisma.producto.update({
        where: { id: exists.id },
        data: { precio: s.price }
      });
    }
  }

  console.log('✅ Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    const fs = require('fs');
    fs.writeFileSync('seed-error.log', JSON.stringify(e, null, 2));
    console.error('❌ SEED ERROR logged to seed-error.log');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });