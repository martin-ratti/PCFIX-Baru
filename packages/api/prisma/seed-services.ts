import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛠️ Iniciando carga de Servicios Técnicos...');

    // 1. Asegurar que existe la Categoría "Servicios" (Para productos)
    const catServicios = await prisma.categoria.upsert({
        where: { nombre: 'Servicios' },
        update: {},
        create: { nombre: 'Servicios' },
    });
    console.log(`✅ Categoría 'Servicios' asegurada (ID: ${catServicios.id})`);

    // 2. Lista de Servicios a crear
    const servicios = [
        {
            title: 'Diagnóstico de PC/Notebook',
            description: 'Revisión completa de hardware y software para detectar fallas.',
            price: 5000,
        },
        {
            title: 'Formateo e Instalación de SO',
            description: 'Instalación de Windows, drivers y paquete básico de programas.',
            price: 15000,
        },
        {
            title: 'Limpieza Profunda y Mantenimiento',
            description: 'Desarme completo, limpieza de polvo y cambio de pasta térmica de alta calidad.',
            price: 20000,
        },
        {
            title: 'Armado de PC',
            description: 'Ensamblaje profesional, gestión de cables e instalación del sistema operativo con todos sus drivers y programas. Te la entregamos lista para usar.',
            price: 25000,
        },
    ];

    // 3. Insertar Servicios en la tabla ServiceItem
    console.log('⏳ Insertando servicios en la base de datos...');

    for (const s of servicios) {
        // Usamos findFirst para evitar duplicados si no hay unique key en title
        const existing = await prisma.serviceItem.findFirst({
            where: { title: s.title }
        });

        if (!existing) {
            await prisma.serviceItem.create({
                data: {
                    title: s.title,
                    description: s.description,
                    price: s.price,
                    active: true
                }
            });
            console.log(`   + Creado: ${s.title}`);
        } else {
            console.log(`   . Ya existe: ${s.title}`);
        }
    }

    console.log('🏁 Carga de servicios finalizada con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });