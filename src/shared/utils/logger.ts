/**
 * Logger centralizado
 *
 * Usa Pino para logging estructurado en formato JSON.
 * Cumple con requisitos de trazabilidad de Ley 21.180.
 *
 * @module shared/utils/logger
 */

import pino from 'pino';
import { config } from '../../config/environment.js';

export const logger = pino({
  level: config.audit.logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    app: config.appName,
    version: config.appVersion,
    env: config.nodeEnv,
  },
  // En desarrollo, formato legible
  ...(config.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Tipos para uso en la aplicacion
export type Logger = typeof logger;
