import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Convirtiendo Servicios en Productos vendibles...');

    // 1. Buscamos la categoría "Servicios" (Ya debería existir del paso anterior)
    let categoria = await prisma.categoria.findFirst({
        where: { nombre: 'Servicios' }
    });

    // Si por casualidad no existe, la creamos rápido para que no falle
    if (!categoria) {
        console.log('⚠️ Categoría Servicios no encontrada, creándola...');
        categoria = await prisma.categoria.create({ data: { nombre: 'Servicios' } });
    }

    // 2. Tus servicios definidos
    const servicios = [
        {
            title: 'Diagnóstico de PC/Notebook',
            description: 'Revisión completa de hardware y software para detectar fallas.',
            price: 5000,
        },
        {
            title: 'Formateo e Instalación de SO',
            description: 'Instalación de Windows, drivers y paquete básico de programas.',
            price: 25000,
        },
        {
            title: 'Limpieza Profunda y Mantenimiento',
            description: 'Desarme completo, limpieza de polvo y cambio de pasta térmica de alta calidad.',
            price: 35000,
        },
        {
            title: 'Armado de PC',
            description: 'Ensamblaje profesional, gestión de cables e instalación del sistema operativo con todos sus drivers y programas. Te la entregamos lista para usar.',
            price: 70000,
        },
    ];

    // 3. Insertar en la tabla PRODUCT
    // 3. Insertar en la tabla Producto
    for (const s of servicios) {
        // Buscamos primero para no depender del unique en nombre si no lo tienes
        const existing = await prisma.producto.findFirst({ where: { nombre: s.title } });

        if (existing) {
            const producto = await prisma.producto.update({
                where: { id: existing.id },
                data: {
                    precio: s.price,
                    descripcion: s.description,
                    stock: 999,
                    categoriaId: categoria.id
                }
            });
            console.log(`✅ Actualizado: ${producto.nombre} ($${producto.precio})`);
        } else {
            const producto = await prisma.producto.create({
                data: {
                    nombre: s.title,
                    descripcion: s.description,
                    precio: s.price,
                    stock: 999,
                    categoriaId: categoria.id,
                    isFeatured: false,
                }
            });
            console.log(`✅ Creado: ${producto.nombre} ($${producto.precio})`);
        }
    }

    console.log('🏁 Sincronización de productos terminada.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });