import { PrismaClient, Role } from '@prisma/client'; // Importamos el Enum Role
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 INICIANDO SEED DE DEBUG...');

    const email = process.env.ADMIN_EMAIL || 'admin@debug.com';
    const pass = process.env.ADMIN_PASSWORD || 'Admin123!';

    console.log(`📡 Conectando a DB para crear admin: ${email}`);

    // 1. Hash Password
    const hashedPassword = await bcrypt.hash(pass, 10);
    console.log('🔑 Contraseña encriptada correctamente.');

    // 2. Upsert Admin (Usando Role.ADMIN explícito)
    try {
        const admin = await prisma.user.upsert({
            where: { email: email },
            update: {
                role: Role.ADMIN, // Usamos el Enum, no string
                password: hashedPassword,
            },
            create: {
                email: email,
                nombre: 'Super',
                apellido: 'Admin',
                password: hashedPassword,
                role: Role.ADMIN, // Usamos el Enum, no string
            },
        });
        console.log('✅ USUARIO ADMIN CREADO/ACTUALIZADO:', admin.id);
    } catch (error) {
        console.error('❌ ERROR AL CREAR ADMIN:', error);
        throw error;
    }

    // 3. Crear Categoría Básica (Para evitar error de foreign key en productos)
    const cat = await prisma.categoria.upsert({
        where: { nombre: 'Servicios' },
        update: {},
        create: { nombre: 'Servicios', padreId: null }
    });
    console.log('✅ Categoría Servicios lista:', cat.id);

    console.log('🏁 SEED DE DEBUG TERMINADO.');
}

main()
    .catch((e) => {
        console.error('💥 ERROR FATAL EN MAIN:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });