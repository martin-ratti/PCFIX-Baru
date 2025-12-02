// src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './infrastructure/database/prismaClient';

// 1. IMPORTAR LAS RUTAS (¿Te faltaba esto?)
import authRoutes from './presentation/routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 3002; // Cambiado de 3001 a 3002

// --- Middlewares Globales ---
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- Rutas de la API ---

// 2. CONECTAR LAS RUTAS (¿Te faltaba esto?)
// Aquí le decimos: "Todo lo que empiece con /api/auth, mándalo al authRoutes"
app.use('/api/auth', authRoutes);

// --- Rutas de Prueba ---
app.get('/health', async (req: Request, res: Response) => {
  try {
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});