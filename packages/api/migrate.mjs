import { config } from 'dotenv';
import { execSync } from 'child_process';

// Carga las variables de entorno desde el archivo .env
config();

try {
  console.log('Iniciando migración de base de datos...');
  // Ejecuta el comando de migración de Prisma
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  console.log('Migración completada exitosamente.');
} catch (error) {
  console.error('Falló la migración:', error);
  process.exit(1);
}