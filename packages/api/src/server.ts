import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path'; // <--- IMPORTANTE
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './shared/database/prismaClient'; // Ruta corregida a shared
import authRoutes from './modules/auth/auth.routes';     // Ruta corregida a modules
import productsRoutes from './modules/products/products.routes'; // Importar rutas
import categoriesRoutes from './modules/categories/categories.routes'; // Importar

const app = express();
const PORT = process.env.PORT || 3002;

// --- Middlewares Globales ---
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Rutas de la API (Módulos) ---
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes); // CONECTAR AQUÍ

// --- Health Check (Para verificar estado) ---
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Consulta simple para verificar conexión a DB
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      success: true, 
      message: 'API is healthy', 
      database: 'Connected' 
    });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'API Error', 
      database: 'Disconnected', 
      error: String(error) 
    });
  }
});

// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
});