import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Convirtiendo Servicios en Productos vendibles...');

    let categoria = await prisma.categoria.findFirst({
        where: { nombre: 'Servicios' }
    });

    if (!categoria) {
        categoria = await prisma.categoria.create({ data: { nombre: 'Servicios' } });
    }

    const servicios = [
        { title: 'Diagnóstico de PC/Notebook', description: 'Revisión completa de hardware y software.', price: 5000 },
        { title: 'Formateo e Instalación de SO', description: 'Instalación de Windows, drivers y programas.', price: 15000 },
        { title: 'Limpieza Profunda y Mantenimiento', description: 'Limpieza de polvo y cambio de pasta térmica.', price: 20000 },
        { title: 'Armado de PC', description: 'Ensamblaje profesional y gestión de cables.', price: 25000 },
    ];

    for (const s of servicios) {
        const slug = s.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Buscamos primero para no depender del unique en nombre si no lo tienes
        const existing = await prisma.producto.findFirst({ where: { nombre: s.title } });

        if (existing) {
            await prisma.producto.update({
                where: { id: existing.id },
                data: {
                    precio: s.price,
                    descripcion: s.description,
                    stock: 999,
                    categoriaId: categoria.id
                }
            });
            console.log(`Updated: ${s.title}`);
        } else {
            await prisma.producto.create({
                data: {
                    nombre: s.title,
                    slug: slug,
                    descripcion: s.description,
                    precio: s.price,
                    stock: 999,
                    categoriaId: categoria.id,
                    isFeatured: false, // Nombre correcto según schema
                    // marcaId opcional
                }
            });
            console.log(`Created: ${s.title}`);
        }
    }
    console.log('🏁 Listo.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });