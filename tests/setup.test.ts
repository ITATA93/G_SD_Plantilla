/**
 * setup.test.ts - Basic structural tests for G_SD_Plantilla (Express app).
 *
 * Validates project structure, package.json integrity, and TypeScript config.
 * Does NOT start the server or require database/Redis connections.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

describe('Project structure', () => {
  it('src/index.ts exists and exports app', () => {
    const indexPath = path.join(srcDir, 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('export { app }');
  });

  it('config/environment.ts exists', () => {
    const configPath = path.join(srcDir, 'config', 'environment.ts');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('core directory contains security module', () => {
    const securityDir = path.join(srcDir, 'core', 'security');
    expect(fs.existsSync(securityDir)).toBe(true);
  });

  it('core directory contains auth module', () => {
    const authDir = path.join(srcDir, 'core', 'auth');
    expect(fs.existsSync(authDir)).toBe(true);
  });

  it('core directory contains audit module', () => {
    const auditDir = path.join(srcDir, 'core', 'audit');
    expect(fs.existsSync(auditDir)).toBe(true);
  });

  it('shared/routes/health.routes.ts exists', () => {
    const healthPath = path.join(srcDir, 'shared', 'routes', 'health.routes.ts');
    expect(fs.existsSync(healthPath)).toBe(true);
  });

  it('shared/utils/logger.ts exists', () => {
    const loggerPath = path.join(srcDir, 'shared', 'utils', 'logger.ts');
    expect(fs.existsSync(loggerPath)).toBe(true);
  });
});

describe('package.json validation', () => {
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  it('has correct project name', () => {
    expect(pkg.name).toBe('plantilla-gobierno-digital-chile');
  });

  it('uses ES module type', () => {
    expect(pkg.type).toBe('module');
  });

  it('has dev script', () => {
    expect(pkg.scripts.dev).toBeDefined();
  });

  it('has build script', () => {
    expect(pkg.scripts.build).toBeDefined();
  });

  it('has test script using vitest', () => {
    expect(pkg.scripts.test).toContain('vitest');
  });

  it('requires Node >= 20', () => {
    expect(pkg.engines?.node).toContain('>=20');
  });

  it('lists express as dependency', () => {
    expect(pkg.dependencies.express).toBeDefined();
  });

  it('lists helmet as dependency (Ley 21.663 security)', () => {
    expect(pkg.dependencies.helmet).toBeDefined();
  });

  it('lists zod as dependency (validation)', () => {
    expect(pkg.dependencies.zod).toBeDefined();
  });

  it('lists prisma as dev dependency (database)', () => {
    expect(pkg.devDependencies.prisma).toBeDefined();
  });

  it('lists vitest as dev dependency', () => {
    expect(pkg.devDependencies.vitest).toBeDefined();
  });
});

describe('tsconfig.json validation', () => {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

  it('targets ES2022 or later', () => {
    expect(tsconfig.compilerOptions.target).toBe('ES2022');
  });

  it('uses strict mode', () => {
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('has source maps enabled', () => {
    expect(tsconfig.compilerOptions.sourceMap).toBe(true);
  });

  it('excludes node_modules and dist', () => {
    expect(tsconfig.exclude).toContain('node_modules');
    expect(tsconfig.exclude).toContain('dist');
  });
});

describe('Security middleware files', () => {
  it('error-handler middleware exists', () => {
    const errorHandlerPath = path.join(srcDir, 'core', 'security', 'middleware', 'error-handler.ts');
    expect(fs.existsSync(errorHandlerPath)).toBe(true);
  });

  it('rate-limiter middleware exists', () => {
    const rateLimiterPath = path.join(srcDir, 'core', 'security', 'middleware', 'rate-limiter.ts');
    expect(fs.existsSync(rateLimiterPath)).toBe(true);
  });
});

describe('Prisma schema', () => {
  it('prisma directory exists', () => {
    const prismaDir = path.join(projectRoot, 'prisma');
    expect(fs.existsSync(prismaDir)).toBe(true);
  });

  it('schema.prisma file exists', () => {
    const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
    expect(fs.existsSync(schemaPath)).toBe(true);
  });
});
