/**
 * Middleware de Auditoria
 *
 * Registra automaticamente todas las solicitudes HTTP.
 *
 * @module core/audit/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Middleware que agrega ID de request y registra la solicitud
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generar ID unico de request si no existe
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Timestamp de inicio
  const startTime = Date.now();

  // Log de request entrante
  logger.info('Request entrante', {
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.run,
  });

  // Interceptar el final de la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.run,
    };

    // Log segun el status code
    if (res.statusCode >= 500) {
      logger.error('Request completada con error del servidor', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completada con error del cliente', logData);
    } else {
      logger.info('Request completada', logData);
    }
  });

  next();
}

/**
 * Middleware para excluir rutas de auditoria detallada
 */
export function excludeFromAudit(paths: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (paths.some(p => req.path.startsWith(p))) {
      // Marcar para excluir de auditoria detallada
      (req as any).skipDetailedAudit = true;
    }
    next();
  };
}
