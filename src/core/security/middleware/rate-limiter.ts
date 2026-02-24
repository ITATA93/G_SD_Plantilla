/**
 * Rate Limiter Middleware
 *
 * Proteccion contra ataques de fuerza bruta y DDoS.
 * Requerido por Ley 21.663 - Marco de Ciberseguridad.
 *
 * @module core/security/middleware/rate-limiter
 */

import rateLimit from 'express-rate-limit';
import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Rate limiter general para todas las rutas
 */
export const rateLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Intente nuevamente mas tarde.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Omitir health checks
    return req.path === '/health' || req.path === '/health/ready';
  },
});

/**
 * Rate limiter estricto para endpoints de autenticacion
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de autenticacion. Espere 15 minutos.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit de autenticacion excedido', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter para APIs sensibles
 */
export const sensitiveApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Limite de solicitudes excedido para esta operacion.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
