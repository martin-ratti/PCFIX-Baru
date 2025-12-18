import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando Update de Producción: Custom Service...');

    // --- Verificando Categoría Servicios ---
    console.log('📂 Verificando Categoría Servicios...');
    const catServicios = await prisma.categoria.upsert({
        where: { nombre: 'Servicios' },
        update: {},
        create: { nombre: 'Servicios', padreId: null }
    });

    // --- PRODUCTO SERVICIO PERSONALIZADO ---
    console.log('🛒 Sincronizando Producto "Servicio Personalizado"...');

    const productName = "Servicio: Servicio Personalizado";
    const exists = await prisma.producto.findFirst({ where: { nombre: productName } });

    const productData = {
        nombre: productName,
        descripcion: "Servicio con precio y descripción variables.",
        precio: 0,
        stock: 99999, // Stock infinito para servicios
        categoriaId: catServicios.id,
        foto: "https://placehold.co/100x100?text=Service",
        peso: 0,
        isFeatured: false
    };

    if (!exists) {
        await prisma.producto.create({ data: productData });
        console.log('✅ Producto CREADO.');
    } else {
        // Aseguramos que tenga precio 0 y stock infinito
        await prisma.producto.update({
            where: { id: exists.id },
            data: { precio: 0, stock: 99999 }
        });
        console.log('✅ Producto ACTUALIZADO.');
    }

    console.log('✨ Update finalizado con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
