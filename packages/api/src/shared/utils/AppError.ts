export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // isOperational = true significa que es un error controlado (ej: "Email inválido")
    // isOperational = false significa que es un bug (ej: "DB desconectada")
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}