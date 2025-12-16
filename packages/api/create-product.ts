
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CREANDO PRODUCTO DE PRUEBA ---');

    // 1. Get a category
    const cat = await prisma.categoria.findFirst();
    if (!cat) {
        console.error('No categories found. Run seed first.');
        return;
    }

    // 2. Create Product
    const product = await prisma.producto.create({
        data: {
            nombre: 'Placa de Video NVIDIA RTX 4090 (TEST)',
            descripcion: 'Producto de prueba físico para validar checkout.',
            precio: 1500000,
            stock: 10,
            peso: 2.5, // 2.5kg
            alto: 15,
            ancho: 30,
            profundidad: 10,
            isFeatured: true,
            categoriaId: cat.id,
            foto: 'https://m.media-amazon.com/images/I/71uniqH7+XL._AC_SL1500_.jpg'
        }
    });

    console.log(`✅ Producto Creado: ${product.nombre} (ID: ${product.id})`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
