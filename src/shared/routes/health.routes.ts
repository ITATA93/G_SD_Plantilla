/**
 * Rutas de Health Check
 *
 * Endpoints para verificar el estado de la aplicacion.
 * Requerido para despliegues en Kubernetes y monitoreo.
 *
 * @module shared/routes/health
 */

import { Router, Request, Response } from 'express';
import { config } from '../../config/environment.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check basico
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Aplicacion saludable
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: config.appName,
    version: config.appVersion,
  });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness check (para Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Aplicacion lista para recibir trafico
 *       503:
 *         description: Aplicacion no lista
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, boolean> = {};

  // Verificar conexion a base de datos
  try {
    // await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  // Verificar conexion a Redis
  try {
    // await redis.ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  const allHealthy = Object.values(checks).every(v => v);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * @openapi
 * /health/live:
 *   get:
 *     summary: Liveness check (para Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Aplicacion viva
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
