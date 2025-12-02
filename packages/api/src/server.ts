import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './shared/database/prismaClient';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import statsRoutes from './modules/stats/stats.routes';
import usersRoutes from './modules/users/users.routes';
import salesRoutes from './modules/sales/sales.routes';

const app = express();
const PORT = process.env.PORT || 3002;

// --- Middlewares Globales ---
app.use(cors());

// Configuración PERMISIVA de Helmet para imágenes cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(morgan('dev'));
app.use(express.json());

// --- Servir Imágenes Estáticas ---
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes); 
app.use('/api/sales', salesRoutes);

// --- Health Check ---
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: 'API is healthy', database: 'Connected' });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ success: false, message: 'API Error', database: 'Disconnected', error: String(error) });
  }
});

// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
});