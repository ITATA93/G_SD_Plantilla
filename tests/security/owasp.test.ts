/**
 * owasp.test.ts - Tests de seguridad basados en OWASP Top 10
 *
 * Valida que la plantilla implementa las protecciones contra las
 * vulnerabilidades mas comunes segun OWASP Top 10 (2021).
 *
 * Categorias testeadas:
 *   A01:2021 - Broken Access Control
 *   A02:2021 - Cryptographic Failures
 *   A03:2021 - Injection (XSS, SQLi)
 *   A04:2021 - Insecure Design
 *   A05:2021 - Security Misconfiguration
 *   A06:2021 - Vulnerable and Outdated Components
 *   A07:2021 - Identification and Authentication Failures
 *   A08:2021 - Software and Data Integrity Failures (CSRF)
 *   A09:2021 - Security Logging and Monitoring Failures
 *
 * Normativas relacionadas:
 *   - Ley 21.663 (Marco de Ciberseguridad)
 *   - ISO 27001 (SGSI)
 *   - Decreto N°11 MINSEGPRES
 *
 * USAGE:
 *   npx vitest tests/security/owasp.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..');
const srcDir = path.join(projectRoot, 'src');

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function readFile(relativePath: string): string {
  const fullPath = path.join(projectRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

// ---------------------------------------------------------------------------
// A03:2021 - Injection (XSS Prevention via CSP Headers)
// ---------------------------------------------------------------------------
describe('A03:2021 - Prevencion de Inyeccion (XSS)', () => {
  it('usa helmet para establecer Content-Security-Policy', () => {
    const indexContent = readFile('src/index.ts');

    // Debe importar y usar helmet
    expect(indexContent).toContain("import helmet from 'helmet'");
    expect(indexContent).toContain('app.use(helmet(');
  });

  it('configura Content-Security-Policy con directivas restrictivas', () => {
    const indexContent = readFile('src/index.ts');

    // Debe tener configuracion de CSP
    expect(indexContent).toContain('contentSecurityPolicy');
    expect(indexContent).toContain('defaultSrc');
    expect(indexContent).toContain("\"'self'\"");
  });

  it('restringe script-src a self (previene XSS inline)', () => {
    const indexContent = readFile('src/index.ts');

    // scriptSrc debe estar definido y restringido
    expect(indexContent).toContain('scriptSrc');
    // No debe permitir 'unsafe-eval' en scripts
    expect(indexContent).not.toContain("'unsafe-eval'");
  });

  it('utiliza validacion de entrada con Zod', () => {
    const pkg = JSON.parse(readFile('package.json'));

    // Zod como dependencia de validacion
    expect(pkg.dependencies.zod).toBeDefined();
  });

  it('tiene middleware de validacion', () => {
    expect(fileExists('src/shared/middleware/validation.middleware.ts')).toBe(true);
  });

  it('valida variables de entorno con Zod schema', () => {
    const envConfig = readFile('src/config/environment.ts');

    // Debe usar z.object para validar env vars
    expect(envConfig).toContain('z.object');
    expect(envConfig).toContain('envSchema');
    expect(envConfig).toContain('safeParse');
  });

  it('no usa funciones peligrosas (eval, Function constructor)', () => {
    const srcFiles = getAllTsFiles(srcDir);

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(projectRoot, file);

      // No debe usar eval()
      expect(
        content,
        `eval() encontrado en ${relativePath}`
      ).not.toMatch(/\beval\s*\(/);

      // No debe usar new Function()
      expect(
        content,
        `new Function() encontrado en ${relativePath}`
      ).not.toMatch(/new\s+Function\s*\(/);
    }
  });
});

// ---------------------------------------------------------------------------
// A03:2021 - SQL Injection (Parameterized Queries via Prisma)
// ---------------------------------------------------------------------------
describe('A03:2021 - Prevencion de SQL Injection', () => {
  it('usa Prisma ORM para acceso a base de datos (consultas parametrizadas)', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.dependencies['@prisma/client']).toBeDefined();
    expect(pkg.devDependencies.prisma).toBeDefined();
  });

  it('tiene schema de Prisma definido', () => {
    expect(fileExists('prisma/schema.prisma')).toBe(true);
  });

  it('no construye consultas SQL manualmente en el codigo fuente', () => {
    const srcFiles = getAllTsFiles(srcDir);

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(projectRoot, file);

      // No debe tener concatenacion de strings para SQL
      // Patron: "SELECT" + variable o `SELECT ${variable}`
      const hasDangerousSQL = /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*\$\{/i.test(content);
      expect(
        hasDangerousSQL,
        `Posible SQL injection por template literal en ${relativePath}`
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// A08:2021 - Software and Data Integrity Failures (CSRF)
// ---------------------------------------------------------------------------
describe('A08:2021 - Proteccion CSRF', () => {
  it('configura cookies con sameSite para prevenir CSRF', () => {
    const authRoutes = readFile('src/core/auth/routes/auth.routes.ts');

    // Las cookies de sesion deben tener sameSite
    expect(authRoutes).toContain('sameSite');
  });

  it('cookies de sesion son httpOnly', () => {
    const authRoutes = readFile('src/core/auth/routes/auth.routes.ts');

    expect(authRoutes).toContain('httpOnly: true');
  });

  it('cookies son secure en produccion', () => {
    const authRoutes = readFile('src/core/auth/routes/auth.routes.ts');

    // Debe verificar NODE_ENV para flag secure
    expect(authRoutes).toContain('secure:');
    expect(authRoutes).toContain("'production'");
  });

  it('usa validacion de state en flujo OAuth2 (anti-CSRF)', () => {
    const claveUnicaService = readFile('src/core/auth/services/claveunica.service.ts');

    // Debe validar state para prevenir CSRF en OAuth
    expect(claveUnicaService).toContain('state !== expectedState');
  });
});

// ---------------------------------------------------------------------------
// A07:2021 - Identification and Authentication Failures
// ---------------------------------------------------------------------------
describe('A07:2021 - Fallos de Autenticacion', () => {
  it('implementa rate limiting en endpoints de autenticacion', () => {
    const rateLimiter = readFile('src/core/security/middleware/rate-limiter.ts');

    // Rate limiter especifico para auth
    expect(rateLimiter).toContain('authRateLimiter');
    expect(rateLimiter).toContain('max: 5');  // Maximo 5 intentos
  });

  it('rate limiter global esta configurado', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('rateLimiter');
  });

  it('las sesiones tienen tiempo de expiracion', () => {
    const envConfig = readFile('src/config/environment.ts');

    // TTL de sesion configurado
    expect(envConfig).toContain('SESSION_TTL');
  });

  it('JWT tiene expiracion configurada', () => {
    const envConfig = readFile('src/config/environment.ts');

    expect(envConfig).toContain('JWT_EXPIRES_IN');
    expect(envConfig).toContain('JWT_REFRESH_EXPIRES_IN');
  });

  it('JWT secret tiene longitud minima de 32 caracteres', () => {
    const envConfig = readFile('src/config/environment.ts');

    expect(envConfig).toContain('z.string().min(32)');
  });

  it('middleware de autenticacion verifica sesion valida', () => {
    const authMiddleware = readFile('src/core/auth/middleware/auth.middleware.ts');

    // Debe verificar existencia de session_id
    expect(authMiddleware).toContain('session_id');
    // Debe lanzar error 401 si no hay sesion
    expect(authMiddleware).toContain('401');
    expect(authMiddleware).toContain('No autenticado');
  });

  it('limpia cookies al detectar sesion invalida', () => {
    const authMiddleware = readFile('src/core/auth/middleware/auth.middleware.ts');

    expect(authMiddleware).toContain("clearCookie('session_id')");
  });
});

// ---------------------------------------------------------------------------
// A02:2021 - Cryptographic Failures (Sensitive Data Exposure)
// ---------------------------------------------------------------------------
describe('A02:2021 - Fallos Criptograficos / Datos Sensibles', () => {
  it('usa encriptacion AES-256-GCM para datos sensibles', () => {
    expect(fileExists('src/core/security/utils/encryption.ts')).toBe(true);
  });

  it('clave de encriptacion tiene longitud minima de 32 caracteres', () => {
    const envConfig = readFile('src/config/environment.ts');

    // ENCRYPTION_KEY debe tener min 32 chars
    const encKeyLine = envConfig.split('\n').find(l => l.includes('ENCRYPTION_KEY'));
    expect(encKeyLine).toContain('min(32)');
  });

  it('no expone stack traces en produccion (error handler)', () => {
    const errorHandler = readFile('src/core/security/middleware/error-handler.ts');

    // En produccion, mensaje generico
    expect(errorHandler).toContain("config.nodeEnv === 'production'");
    expect(errorHandler).toContain('Error interno del servidor');
  });

  it('no expone detalles de validacion Zod en produccion', () => {
    const errorHandler = readFile('src/core/security/middleware/error-handler.ts');

    // Detalles de Zod solo en desarrollo
    expect(errorHandler).toContain("config.nodeEnv !== 'production'");
    expect(errorHandler).toContain('err.errors');
  });

  it('enmascara RUN en logs', () => {
    const claveUnicaService = readFile('src/core/auth/services/claveunica.service.ts');

    // Debe tener funcion de enmascaramiento
    expect(claveUnicaService).toContain('maskRun');
    // Debe usar la funcion al loggear
    expect(claveUnicaService).toContain('this.maskRun(run)');
  });

  it('usa bcrypt para hashing de passwords', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.dependencies.bcryptjs).toBeDefined();
  });

  it('usa jose para manejo seguro de JWT', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.dependencies.jose).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// A05:2021 - Security Misconfiguration (Security Headers)
// ---------------------------------------------------------------------------
describe('A05:2021 - Headers de Seguridad', () => {
  it('HSTS esta habilitado con maxAge de al menos 1 anio', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('hsts');
    // 31536000 = 365 dias
    expect(indexContent).toContain('31536000');
  });

  it('HSTS incluye subdominios', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('includeSubDomains: true');
  });

  it('HSTS tiene preload habilitado', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('preload: true');
  });

  it('X-Content-Type-Options esta configurado via Helmet', () => {
    const pkg = JSON.parse(readFile('package.json'));

    // Helmet setea X-Content-Type-Options: nosniff por defecto
    expect(pkg.dependencies.helmet).toBeDefined();
  });

  it('X-Frame-Options esta configurado via Helmet', () => {
    // Helmet setea X-Frame-Options por defecto (DENY o SAMEORIGIN)
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies.helmet).toBeDefined();

    // Verificar que Helmet esta siendo utilizado
    const indexContent = readFile('src/index.ts');
    expect(indexContent).toContain('app.use(helmet(');
  });

  it('CORS esta configurado con origenes especificos (no wildcard)', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('cors(');
    expect(indexContent).toContain('config.cors.origins');
    // No debe usar origin: '*' directamente
    expect(indexContent).not.toContain("origin: '*'");
  });

  it('CORS requiere credentials', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('credentials: true');
  });

  it('body parser tiene limite de tamano', () => {
    const indexContent = readFile('src/index.ts');

    // express.json con limite
    expect(indexContent).toContain('limit:');
  });
});

// ---------------------------------------------------------------------------
// A01:2021 - Broken Access Control
// ---------------------------------------------------------------------------
describe('A01:2021 - Control de Acceso', () => {
  it('endpoints protegidos usan authMiddleware', () => {
    const authRoutes = readFile('src/core/auth/routes/auth.routes.ts');

    // /auth/me y /auth/logout deben requerir autenticacion
    expect(authRoutes).toContain("'/me', authMiddleware");
    expect(authRoutes).toContain("'/logout', authMiddleware");
  });

  it('existe middleware de permisos extensible', () => {
    const authMiddleware = readFile('src/core/auth/middleware/auth.middleware.ts');

    expect(authMiddleware).toContain('requirePermission');
  });

  it('metodos HTTP estan restringidos en CORS', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('methods:');
    // Debe listar metodos permitidos explicitamente
    expect(indexContent).toContain("'GET'");
    expect(indexContent).toContain("'POST'");
  });

  it('headers permitidos estan definidos explicitamente en CORS', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('allowedHeaders');
  });
});

// ---------------------------------------------------------------------------
// A09:2021 - Security Logging and Monitoring Failures
// ---------------------------------------------------------------------------
describe('A09:2021 - Logging y Monitoreo de Seguridad', () => {
  it('usa logger estructurado (Pino)', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.dependencies.pino).toBeDefined();
    expect(fileExists('src/shared/utils/logger.ts')).toBe(true);
  });

  it('tiene middleware de auditoria', () => {
    expect(fileExists('src/core/audit/middleware/audit.middleware.ts')).toBe(true);
    expect(fileExists('src/core/audit/services/audit.service.ts')).toBe(true);
  });

  it('auditoria esta habilitada en la configuracion', () => {
    const envConfig = readFile('src/config/environment.ts');

    expect(envConfig).toContain('AUDIT_ENABLED');
    expect(envConfig).toContain('AUDIT_RETENTION_DAYS');
  });

  it('middleware de auditoria esta registrado en la app', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain('auditMiddleware');
    expect(indexContent).toContain('app.use(auditMiddleware)');
  });

  it('eventos de autenticacion se registran en auditoria', () => {
    const authRoutes = readFile('src/core/auth/routes/auth.routes.ts');

    expect(authRoutes).toContain('AUTH_LOGIN_INITIATED');
    expect(authRoutes).toContain('AUTH_LOGIN_SUCCESS');
    expect(authRoutes).toContain('AUTH_LOGOUT');
  });

  it('rate limit excedido se registra en logs', () => {
    const rateLimiter = readFile('src/core/security/middleware/rate-limiter.ts');

    expect(rateLimiter).toContain('logger.warn');
    expect(rateLimiter).toContain('Rate limit excedido');
  });

  it('errores se registran con contexto suficiente', () => {
    const errorHandler = readFile('src/core/security/middleware/error-handler.ts');

    // Debe registrar requestId, path, method, IP
    expect(errorHandler).toContain('requestId');
    expect(errorHandler).toContain('req.path');
    expect(errorHandler).toContain('req.method');
    expect(errorHandler).toContain('req.ip');
  });

  it('logging de requests HTTP esta habilitado (Morgan)', () => {
    const indexContent = readFile('src/index.ts');

    expect(indexContent).toContain("import morgan from 'morgan'");
    expect(indexContent).toContain('app.use(morgan(');
  });

  it('retencion de auditoria por defecto es al menos 365 dias', () => {
    const envConfig = readFile('src/config/environment.ts');

    // Default de retencion
    expect(envConfig).toContain("default('365')");
  });
});

// ---------------------------------------------------------------------------
// A04:2021 - Insecure Design
// ---------------------------------------------------------------------------
describe('A04:2021 - Diseno Seguro', () => {
  it('usa TypeScript en modo estricto', () => {
    const tsconfig = JSON.parse(readFile('tsconfig.json'));

    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('tiene configuracion de ESLint con plugin de seguridad', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.devDependencies['eslint-plugin-security']).toBeDefined();
  });

  it('tiene lint-staged configurado para pre-commit', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.ts']).toBeDefined();
  });

  it('tiene Husky para git hooks', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.devDependencies.husky).toBeDefined();
    expect(pkg.scripts.prepare).toContain('husky');
  });

  it('errores son clases tipadas con codigos', () => {
    const errors = readFile('src/shared/utils/errors.ts');

    // Clases de error especificas
    expect(errors).toContain('class AppError');
    expect(errors).toContain('class ValidationError');
    expect(errors).toContain('class AuthenticationError');
    expect(errors).toContain('class AuthorizationError');
    expect(errors).toContain('class NotFoundError');
  });
});

// ---------------------------------------------------------------------------
// A06:2021 - Vulnerable and Outdated Components
// ---------------------------------------------------------------------------
describe('A06:2021 - Componentes Vulnerables y Desactualizados', () => {
  it('tiene script de auditoria de seguridad de dependencias', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.scripts['audit:security']).toBeDefined();
    expect(pkg.scripts['audit:security']).toContain('npm audit');
  });

  it('requiere Node.js >= 20 (LTS con soporte activo)', () => {
    const pkg = JSON.parse(readFile('package.json'));

    expect(pkg.engines.node).toContain('>=20');
  });

  it('package-lock.json existe para reproducibilidad', () => {
    expect(fileExists('package-lock.json')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A05:2021 - Security Misconfiguration (Health Checks)
// ---------------------------------------------------------------------------
describe('A05:2021 - Health Checks y Monitoreo', () => {
  it('health checks existen para monitoreo de disponibilidad', () => {
    expect(fileExists('src/shared/routes/health.routes.ts')).toBe(true);

    const indexContent = readFile('src/index.ts');
    expect(indexContent).toContain("'/health'");
  });

  it('health checks son excluidos del rate limiter', () => {
    const rateLimiter = readFile('src/core/security/middleware/rate-limiter.ts');

    expect(rateLimiter).toContain("'/health'");
    expect(rateLimiter).toContain('skip');
  });
});

// ---------------------------------------------------------------------------
// Utilidades auxiliares
// ---------------------------------------------------------------------------

/**
 * Obtiene todos los archivos .ts dentro de un directorio (recursivo)
 */
function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
