/**
 * Rutas de Autenticacion
 *
 * Endpoints para autenticacion con ClaveUnica y gestion de sesiones.
 *
 * @module core/auth/routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { claveUnicaService } from '../services/claveunica.service.js';
import { sessionService } from '../services/session.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { auditLog } from '../../audit/services/audit.service.js';
import { logger } from '../../../shared/utils/logger.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   get:
 *     summary: Inicia el flujo de autenticacion con ClaveUnica
 *     tags: [Autenticacion]
 *     responses:
 *       302:
 *         description: Redirige a ClaveUnica
 */
router.get('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, state, nonce } = await claveUnicaService.getAuthorizationUrl();

    // Guardar state y nonce en sesion temporal
    await sessionService.setTempAuth(state, { nonce, returnUrl: req.query.returnUrl as string });

    await auditLog({
      action: 'AUTH_LOGIN_INITIATED',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
    });

    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/callback:
 *   get:
 *     summary: Callback de ClaveUnica
 *     tags: [Autenticacion]
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *       - name: state
 *         in: query
 *         required: true
 *     responses:
 *       302:
 *         description: Redirige a la aplicacion
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.warn('ClaveUnica: Error en callback', { error, error_description });
      return res.redirect(`/auth/error?message=${encodeURIComponent(error_description as string || 'Error de autenticacion')}`);
    }

    if (!code || !state) {
      return res.redirect('/auth/error?message=Parametros faltantes');
    }

    // Recuperar datos temporales
    const tempAuth = await sessionService.getTempAuth(state as string);
    if (!tempAuth) {
      return res.redirect('/auth/error?message=Sesion expirada');
    }

    // Intercambiar codigo por tokens
    const authResult = await claveUnicaService.handleCallback(
      code as string,
      state as string,
      state as string,
      tempAuth.nonce
    );

    // Crear sesion de usuario
    const session = await sessionService.createSession({
      run: authResult.user.run,
      nombres: authResult.user.nombres,
      apellidos: authResult.user.apellidos,
      idToken: authResult.idToken,
    });

    await auditLog({
      action: 'AUTH_LOGIN_SUCCESS',
      userId: authResult.user.run,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
    });

    // Limpiar datos temporales
    await sessionService.deleteTempAuth(state as string);

    // Establecer cookie de sesion
    res.cookie('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hora
    });

    res.redirect(tempAuth.returnUrl || '/');
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Cierra la sesion del usuario
 *     tags: [Autenticacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesion cerrada exitosamente
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.cookies.session_id;
    const session = await sessionService.getSession(sessionId);

    if (session) {
      await auditLog({
        action: 'AUTH_LOGOUT',
        userId: session.run,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
      });

      // Obtener URL de logout de ClaveUnica
      const logoutUrl = await claveUnicaService.getLogoutUrl(session.idToken);

      // Destruir sesion local
      await sessionService.destroySession(sessionId);
    }

    res.clearCookie('session_id');
    res.json({ success: true, message: 'Sesion cerrada' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Obtiene informacion del usuario autenticado
 *     tags: [Autenticacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informacion del usuario
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      run: req.user!.run,
      nombres: req.user!.nombres,
      apellidos: req.user!.apellidos,
    },
  });
});

export { router as authRoutes };
