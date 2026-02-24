/**
 * Error Handler Middleware
 *
 * Manejo centralizado de errores con sanitizacion de respuestas.
 * Evita fuga de informacion sensible (OWASP Top 10).
 *
 * @module core/security/middleware/error-handler
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../../../config/environment.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Log del error completo (solo interno)
  logger.error('Error en request', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.run,
  });

  // Error de aplicacion conocido
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Error de validacion Zod
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validacion en los datos enviados',
        details: config.nodeEnv !== 'production' ? err.errors : undefined,
        requestId,
      },
    };

    res.status(400).json(response);
    return;
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && 'body' in err) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la solicitud no es JSON valido',
        requestId,
      },
    };

    res.status(400).json(response);
    return;
  }

  // Error generico - NO exponer detalles en produccion
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production'
        ? 'Error interno del servidor'
        : err.message,
      requestId,
    },
  };

  res.status(500).json(response);
}

/**
 * Middleware para manejar rutas no encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
    },
  };

  res.status(404).json(response);
}
