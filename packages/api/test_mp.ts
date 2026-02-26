import { PrismaClient } from '@prisma/client';
import { MercadoPagoService } from './src/shared/services/MercadoPagoService';

const prisma = new PrismaClient();

async function test() {
    // Simular exactamente lo que hace findById
    const sale = await prisma.venta.findUnique({
        where: { id: 14 },
        include: { lineasVenta: { include: { producto: true } }, cliente: { include: { user: true } } }
    });

    if (!sale) {
        console.log('Venta no encontrada, probando con id 13...');
        const sale2 = await prisma.venta.findUnique({
            where: { id: 13 },
            include: { lineasVenta: { include: { producto: true } }, cliente: { include: { user: true } } }
        });
        if (!sale2) {
            console.log('Tampoco encontrada');
            await prisma.$disconnect();
            return;
        }
        console.log('\n=== DATOS DE VENTA #13 ===');
        console.log('tipoEntrega:', sale2.tipoEntrega);
        console.log('costoEnvio:', sale2.costoEnvio, '(tipo:', typeof sale2.costoEnvio, ')');
        console.log('costoEnvio como Number:', Number(sale2.costoEnvio));
        console.log('montoTotal:', sale2.montoTotal);
        console.log('lineasVenta:', sale2.lineasVenta.length);

        // Simular la lógica del controller
        const items: any[] = sale2.lineasVenta.map((line: any) => {
            const unitPrice = Number(line.subTotal) / Number(line.cantidad);
            return {
                id: String(line.productoId),
                title: line.producto.nombre || 'Producto',
                quantity: Number(line.cantidad),
                unit_price: Number(unitPrice.toFixed(2)),
                currency_id: 'ARS'
            };
        });

        const costoEnvioNum = sale2.tipoEntrega === 'ENVIO' ? Number(sale2.costoEnvio ?? 0) : 0;
        console.log('\n=== LOGICA DEL CONTROLLER ===');
        console.log('costoEnvioNum:', costoEnvioNum);
        console.log('Condicion (tipoEntrega === ENVIO):', sale2.tipoEntrega === 'ENVIO');
        console.log('Items antes de enviar a MP:', JSON.stringify(items, null, 2));

        // Simular lo que haría MercadoPagoService
        if (costoEnvioNum > 0) {
            items.push({
                id: 'shipping',
                title: 'Costo de envio',
                quantity: 1,
                unit_price: costoEnvioNum,
                currency_id: 'ARS'
            });
        }
        console.log('\nItems FINALES (incluyendo envio):', JSON.stringify(items, null, 2));
        await prisma.$disconnect();
        return;
    }

    console.log('\n=== DATOS DE VENTA #14 ===');
    console.log('tipoEntrega:', sale.tipoEntrega);
    console.log('costoEnvio:', sale.costoEnvio, '(tipo:', typeof sale.costoEnvio, ')');
    console.log('costoEnvio como Number:', Number(sale.costoEnvio));
    console.log('montoTotal:', sale.montoTotal);
    console.log('lineasVenta:', sale.lineasVenta.length);

    const items: any[] = sale.lineasVenta.map((line: any) => {
        const unitPrice = Number(line.subTotal) / Number(line.cantidad);
        return {
            id: String(line.productoId),
            title: line.producto.nombre || 'Producto',
            quantity: Number(line.cantidad),
            unit_price: Number(unitPrice.toFixed(2)),
            currency_id: 'ARS'
        };
    });

    const costoEnvioNum = sale.tipoEntrega === 'ENVIO' ? Number(sale.costoEnvio ?? 0) : 0;
    console.log('\n=== LOGICA DEL CONTROLLER ===');
    console.log('costoEnvioNum:', costoEnvioNum);
    console.log('Condicion (tipoEntrega === ENVIO):', sale.tipoEntrega === 'ENVIO');
    console.log('Items antes:', JSON.stringify(items, null, 2));

    if (costoEnvioNum > 0) {
        items.push({
            id: 'shipping',
            title: 'Costo de envio',
            quantity: 1,
            unit_price: costoEnvioNum,
            currency_id: 'ARS'
        });
    }
    console.log('\nItems FINALES:', JSON.stringify(items, null, 2));
    await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
