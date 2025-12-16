

import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTICO DE BASE DE DATOS LOCAL ---');

    const productCount = await prisma.producto.count();
    console.log(`Productos en DB: ${productCount}`);

    if (productCount > 0) {
        const products = await prisma.producto.findMany({
            select: { id: true, nombre: true, stock: true },
            take: 5
        });
        console.log('Primeros 5 productos:', JSON.stringify(products, null, 2));
    } else {
        console.log('⚠️ LA BASE DE DATOS ESTÁ VACÍA (Sin productos)');
    }

    const carts = await prisma.cart.findMany({
        include: { items: true }
    });
    console.log('Carritos Activos:', carts.length);
    if (carts.length > 0) {
        console.log('Detalle Carritos:', JSON.stringify(carts, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
