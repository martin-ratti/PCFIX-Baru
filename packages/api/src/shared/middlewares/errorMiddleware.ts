import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // LOG: Aquí podrías integrar un servicio como Sentry o Datadog en el futuro
  console.error('🔥 ERROR:', err);

  if (process.env.NODE_ENV === 'development') {
    // En desarrollo: Enviamos todo el detalle
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // En producción: NO enviamos detalles técnicos al usuario
    if (err.isOperational) {
      // Error conocido (ej: usuario no encontrado)
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } else {
      // Error de programación o desconocido (ej: fallo de DB)
      console.error('🔥 ERROR CRÍTICO 500:', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: '¡Ups! Algo salió mal en nuestros servidores. Por favor intenta más tarde.'
      });
    }
  }
};