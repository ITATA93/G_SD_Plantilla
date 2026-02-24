import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/environment.js';
import { errorHandler } from './core/security/middleware/error-handler.js';
import { rateLimiter } from './core/security/middleware/rate-limiter.js';
import { auditMiddleware } from './core/audit/middleware/audit.middleware.js';
import { logger } from './shared/utils/logger.js';
import { authRoutes } from './core/auth/routes/auth.routes.js';
import { healthRoutes } from './shared/routes/health.routes.js';

const app = express();

// Seguridad - Headers (Ley 21.663)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configurado
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Compresion
app.use(compression());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Rate limiting (Seguridad)
app.use(rateLimiter);

// Auditoria (Trazabilidad normativa)
app.use(auditMiddleware);

// Rutas
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);

// Aqui se registran los modulos CRUD dinamicamente
// import { registerModules } from './modules/index.js';
// registerModules(app);

// Manejo de errores centralizado
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT}`);
  logger.info(`Ambiente: ${config.nodeEnv}`);
  logger.info(`Aplicacion: ${config.appName}`);
});

export { app };
