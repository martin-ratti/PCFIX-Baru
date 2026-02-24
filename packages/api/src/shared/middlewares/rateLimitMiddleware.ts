import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: { success: false, error: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: { success: false, error: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});
