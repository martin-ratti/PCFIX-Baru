import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // LOGIG REFINADO:
  // Si es un error operacional (4xx) o controlado, usamos WARN para no alarmar.
  // Si es un error desconocido o 500, usamos ERROR para investigar.
  if (err.isOperational || err.statusCode < 500) {
    console.warn(`⚠️ [${req.method}] ${req.originalUrl} >> ${err.statusCode}: ${err.message}`);
  } else {
    console.error('🔥 ERROR CRÍTICO 500:', err);
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } else {
      // Mensaje genérico para el cliente en errores 500 (Production)
      res.status(500).json({
        success: false,
        status: 'error',
        message: '¡Ups! Algo salió mal en nuestros servidores. Por favor intenta más tarde.'
      });
    }
  }
};