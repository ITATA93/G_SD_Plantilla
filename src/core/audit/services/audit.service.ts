/**
 * Servicio de Auditoria
 *
 * Sistema de registro de eventos para cumplimiento normativo.
 * Requerido por Ley 21.180 (Transformacion Digital) y Ley 21.663 (Ciberseguridad).
 *
 * Los registros de auditoria deben conservarse por minimo 365 dias.
 *
 * @module core/audit/services/audit
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../../../config/environment.js';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export type AuditAction =
  // Autenticacion
  | 'AUTH_LOGIN_INITIATED'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOKEN_REFRESH'
  // CRUD Operations
  | 'RESOURCE_CREATE'
  | 'RESOURCE_READ'
  | 'RESOURCE_UPDATE'
  | 'RESOURCE_DELETE'
  | 'RESOURCE_LIST'
  | 'RESOURCE_EXPORT'
  // Seguridad
  | 'SECURITY_ACCESS_DENIED'
  | 'SECURITY_RATE_LIMIT'
  | 'SECURITY_INVALID_TOKEN'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'
  // Interoperabilidad
  | 'INTEROP_PISEE_REQUEST'
  | 'INTEROP_PISEE_RESPONSE'
  | 'INTEROP_FHIR_REQUEST'
  | 'INTEROP_FHIR_RESPONSE'
  // Sistema
  | 'SYSTEM_CONFIG_CHANGE'
  | 'SYSTEM_ERROR';

interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  result?: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Registra un evento de auditoria
 */
export async function auditLog(params: AuditLogParams): Promise<AuditEntry> {
  if (!config.audit.enabled) {
    return {} as AuditEntry;
  }

  const entry: AuditEntry = {
    id: uuidv4(),
    timestamp: new Date(),
    action: params.action,
    userId: params.userId,
    sessionId: params.sessionId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    details: sanitizeDetails(params.details),
    result: params.result || 'success',
    errorMessage: params.errorMessage,
  };

  // Log estructurado
  logger.info('AUDIT', {
    auditId: entry.id,
    action: entry.action,
    userId: entry.userId ? maskUserId(entry.userId) : undefined,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    result: entry.result,
    ip: entry.ipAddress,
  });

  // Aqui se puede persistir en base de datos
  // await prisma.auditLog.create({ data: entry });

  return entry;
}

/**
 * Crea un decorador para auditar operaciones CRUD automaticamente
 */
export function createCrudAuditor(resourceType: string) {
  return {
    async create(userId: string, resourceId: string, details?: Record<string, unknown>) {
      return auditLog({
        action: 'RESOURCE_CREATE',
        userId,
        resourceType,
        resourceId,
        details,
      });
    },

    async read(userId: string, resourceId: string) {
      return auditLog({
        action: 'RESOURCE_READ',
        userId,
        resourceType,
        resourceId,
      });
    },

    async update(userId: string, resourceId: string, changes?: Record<string, unknown>) {
      return auditLog({
        action: 'RESOURCE_UPDATE',
        userId,
        resourceType,
        resourceId,
        details: { changes },
      });
    },

    async delete(userId: string, resourceId: string) {
      return auditLog({
        action: 'RESOURCE_DELETE',
        userId,
        resourceType,
        resourceId,
      });
    },

    async list(userId: string, filters?: Record<string, unknown>) {
      return auditLog({
        action: 'RESOURCE_LIST',
        userId,
        resourceType,
        details: { filters },
      });
    },
  };
}

/**
 * Sanitiza detalles para evitar registrar datos sensibles
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Enmascara el RUN/ID de usuario para logs
 */
function maskUserId(userId: string): string {
  if (userId.includes('-')) {
    // Es un RUN
    const parts = userId.split('-');
    const numero = parts[0];
    return `${numero.slice(0, 2)}***${numero.slice(-2)}-${parts[1]}`;
  }
  // Otro tipo de ID
  return `${userId.slice(0, 4)}***`;
}
