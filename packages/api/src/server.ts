// Sentry must be initialized FIRST before any other imports
import 'dotenv/config';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  });
}

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

// --- SEGURIDAD Y CONFIGURACIÓN (CORS CORREGIDO) ---

// 1. Obtenemos la variable de entorno
const FRONTEND_URL = process.env.FRONTEND_URL;

const whitelist = [
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
  'http://localhost:3002',
  'https://pcfixbaru.com.ar',
  'https://www.pcfixbaru.com.ar',
  'http://pcfixbaru.com.ar',
  'http://www.pcfixbaru.com.ar',
];

// Si hay una URL específica en Railway (y no es *), la agregamos dinámicamente
if (FRONTEND_URL && FRONTEND_URL !== '*') {
  // Soporte para múltiples URLs separadas por coma (opcional)
  const urls = FRONTEND_URL.split(',');
  urls.forEach(url => {
    if (!whitelist.includes(url.trim())) whitelist.push(url.trim());
  });
}

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // CASO 1: Si Railway dice "Permitir todo (*)", dejamos pasar a todos.
    if (FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // CASO 2: Si no hay origen (postman/server-to-server) o está en la lista blanca
    // O si es un dominio de Vercel (para Previews / Deployments)
    if (
      !origin ||
      whitelist.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      console.error(`🚫 Bloqueado por CORS: ${origin}`);
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

// --- DEBUG SMTP (TEMPORARY) ---
import nodemailer from 'nodemailer';
app.get('/api/debug/test-email', async (req: Request, res: Response) => {
  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      user: process.env.SMTP_USER,
      passLength: process.env.SMTP_PASS?.length || 0,
    };

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000, // 5s timeout
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Diagnóstico SMTP Producción",
      text: "Si ves esto, el email funciona desde producción.",
    });

    res.json({
      success: true,
      message: 'Email enviado correctamente',
      config
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT, // Raw value
        user: process.env.SMTP_USER,
        passLength: process.env.SMTP_PASS?.length || 0
      }
    });
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
  console.log(`🔒 CORS Whitelist: ${JSON.stringify(whitelist)} (o FRONTEND_URL='${FRONTEND_URL}')`);

  try {
    new CronService().start();
  } catch (e) {
    console.error('❌ Error iniciando Cron Jobs:', e);
  }
});

export default app;