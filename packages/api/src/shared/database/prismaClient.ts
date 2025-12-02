import { PrismaClient } from '@prisma/client';

// Evita múltiples instancias de Prisma en desarrollo debido al hot-reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Logs útiles para depuración
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Verificación de conexión opcional al importar
prisma.$connect()
  .then(() => console.log('✅ Conexión a PostgreSQL establecida exitosamente'))
  .catch((e) => console.error('❌ Error conectando a PostgreSQL', e));