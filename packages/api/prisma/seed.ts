// packages/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categorias = [
    { nombre: 'Procesadores' },
    { nombre: 'Placas de Video' },
    { nombre: 'Memorias RAM' },
    { nombre: 'Almacenamiento' },
    { nombre: 'Periféricos' },
    { nombre: 'Gabinetes' },
    { nombre: 'Monitores' },
  ];

  console.log('🌱 Sembrando categorías...');

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categorías listas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });