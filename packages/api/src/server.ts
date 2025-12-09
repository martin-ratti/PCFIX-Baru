import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { prisma } from './shared/database/prismaClient';

// Imports de Rutas
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import brandsRoutes from './modules/brands/brands.routes';
import bannersRoutes from './modules/banners/banners.routes';
import statsRoutes from './modules/stats/stats.routes';
import usersRoutes from './modules/users/users.routes';
import salesRoutes from './modules/sales/sales.routes';
import configRoutes from './modules/config/config.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import technicalRoutes from './modules/technical/technical.routes';
import cartRoutes from './modules/cart/cart.routes';

// Imports de Manejo de Errores y Servicios
import { AppError } from './shared/utils/AppError';
import { globalErrorHandler } from './shared/middlewares/errorMiddleware';
import { CronService } from './shared/services/cron.service';

const app = express();
const PORT = process.env.PORT || 3002;

// --- SEGURIDAD Y CONFIGURACIÓN ---

const whitelist = [
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
  'http://localhost:3002',
  'https://pcfixbaru.com.ar',
  'https://www.pcfixbaru.com.ar',
];

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`Bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ARCHIVOS ESTÁTICOS ---
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware para logs y debug (SOLO en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    console.log(`[DEBUG] Headers:`, req.headers['content-type']);
    // Nota: No loguear req.body en producción para evitar exponer datos sensibles
    console.log(`[DEBUG] Body:`, req.body);
    next();
  });
}

// --- RATE LIMITING ---
import { authLimiter, apiLimiter } from './shared/middlewares/rateLimitMiddleware';
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/config', configRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/technical', technicalRoutes);
app.use('/api/cart', cartRoutes);

// --- HEALTH CHECK ---
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Database Check Failed:', error);
    res.status(500).json({ success: false, message: 'API Error', database: 'Disconnected' });
  }
});

// --- MANEJO DE ERRORES GLOBAL (Siempre al final) ---

// 1. Manejo de rutas inexistentes (404)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl} en este servidor`, 404));
});

// 2. Middleware de Errores
app.use(globalErrorHandler);

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    new CronService().start();
  } catch (e) {
    console.error('❌ Error iniciando Cron Jobs:', e);
  }
});

export default app;