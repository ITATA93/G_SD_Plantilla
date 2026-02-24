import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Aplicacion
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_NAME: z.string().default('Aplicacion Gobierno Digital'),
  APP_VERSION: z.string().default('1.0.0'),

  // ClaveUnica
  CLAVEUNICA_CLIENT_ID: z.string().optional(),
  CLAVEUNICA_CLIENT_SECRET: z.string().optional(),
  CLAVEUNICA_REDIRECT_URI: z.string().url().optional(),
  CLAVEUNICA_ISSUER: z.string().url().default('https://accounts.claveunica.gob.cl/openid'),
  CLAVEUNICA_SCOPES: z.string().default('openid run name'),

  // Base de datos
  DATABASE_URL: z.string(),
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SESSION_TTL: z.string().transform(Number).default('3600'),

  // Seguridad
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().min(32),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // PISEE
  PISEE_API_URL: z.string().url().optional(),
  PISEE_API_KEY: z.string().optional(),
  PISEE_INSTITUTION_ID: z.string().optional(),

  // FHIR
  FHIR_SERVER_URL: z.string().url().optional(),
  FHIR_CLIENT_ID: z.string().optional(),
  FHIR_CLIENT_SECRET: z.string().optional(),

  // Auditoria
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  AUDIT_ENABLED: z.string().transform(v => v === 'true').default('true'),
  AUDIT_RETENTION_DAYS: z.string().transform(Number).default('365'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Error en variables de entorno:');
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  appName: env.APP_NAME,
  appVersion: env.APP_VERSION,

  claveUnica: {
    clientId: env.CLAVEUNICA_CLIENT_ID,
    clientSecret: env.CLAVEUNICA_CLIENT_SECRET,
    redirectUri: env.CLAVEUNICA_REDIRECT_URI,
    issuer: env.CLAVEUNICA_ISSUER,
    scopes: env.CLAVEUNICA_SCOPES.split(' '),
  },

  database: {
    url: env.DATABASE_URL,
    poolMin: env.DATABASE_POOL_MIN,
    poolMax: env.DATABASE_POOL_MAX,
  },

  redis: {
    url: env.REDIS_URL,
    sessionTtl: env.SESSION_TTL,
  },

  security: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    encryptionKey: env.ENCRYPTION_KEY,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
    },
  },

  cors: {
    origins: env.CORS_ORIGINS.split(','),
  },

  pisee: {
    apiUrl: env.PISEE_API_URL,
    apiKey: env.PISEE_API_KEY,
    institutionId: env.PISEE_INSTITUTION_ID,
  },

  fhir: {
    serverUrl: env.FHIR_SERVER_URL,
    clientId: env.FHIR_CLIENT_ID,
    clientSecret: env.FHIR_CLIENT_SECRET,
  },

  audit: {
    enabled: env.AUDIT_ENABLED,
    retentionDays: env.AUDIT_RETENTION_DAYS,
    logLevel: env.LOG_LEVEL,
  },
};

export type Config = typeof config;
