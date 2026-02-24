/**
 * Middleware de Autenticacion
 *
 * Verifica que las solicitudes tengan una sesion valida.
 *
 * @module core/auth/middleware
 */

import { Request, Response, NextFunction } from 'express';
import { sessionService, UserSession } from '../services/session.service.js';
import { AppError } from '../../../shared/utils/errors.js';

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        run: string;
        nombres: string;
        apellidos: string;
        sessionId: string;
      };
      session?: UserSession;
    }
  }
}

/**
 * Middleware que requiere autenticacion
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
      throw new AppError('No autenticado', 401);
    }

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      res.clearCookie('session_id');
      throw new AppError('Sesion expirada o invalida', 401);
    }

    // Adjuntar informacion del usuario a la request
    req.user = {
      run: session.run,
      nombres: session.nombres,
      apellidos: session.apellidos,
      sessionId: session.id,
    };
    req.session = session;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware opcional de autenticacion
 * No falla si no hay sesion, pero adjunta el usuario si existe
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.cookies?.session_id;

    if (sessionId) {
      const session = await sessionService.getSession(sessionId);

      if (session) {
        req.user = {
          run: session.run,
          nombres: session.nombres,
          apellidos: session.apellidos,
          sessionId: session.id,
        };
        req.session = session;
      }
    }

    next();
  } catch (error) {
    // En caso de error, simplemente continuamos sin usuario
    next();
  }
}

/**
 * Middleware para verificar permisos/roles especificos
 * Extensible para integracion con sistemas de permisos
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }

      // Aqui se puede integrar con un sistema de permisos
      // Por ejemplo: verificar contra una base de datos o servicio de permisos
      // const hasPermission = await permissionService.check(req.user.run, permission);

      // Por ahora, permitimos todo si el usuario esta autenticado
      // TODO: Implementar verificacion de permisos real
      next();
    } catch (error) {
      next(error);
    }
  };
}
