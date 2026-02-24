/**
 * Tipos para ClaveÚnica - Gobierno Digital Chile
 *
 * Basado en la especificación OpenID Connect de ClaveÚnica.
 * Documentación: https://digital.gob.cl/transformacion-digital/estandares-y-guias/
 *
 * @module core/auth/types/claveunica
 */

/**
 * Información del RUT/RUN del ciudadano
 */
export interface RolUnico {
  /** Número del RUN sin dígito verificador */
  numero: number;
  /** Dígito verificador */
  DV: string;
  /** Tipo de documento (siempre "RUN" para ciudadanos chilenos) */
  tipo: 'RUN';
}

/**
 * Nombre del ciudadano según Registro Civil
 */
export interface NombreClaveUnica {
  /** Lista de nombres */
  nombres: string[];
  /** Lista de apellidos */
  apellidos: string[];
}

/**
 * Respuesta del endpoint userinfo de ClaveÚnica
 */
export interface ClaveUnicaUserInfo {
  /** Subject - Identificador único del usuario */
  sub: string;
  /** Información del RUN */
  RolUnico: RolUnico;
  /** Nombre completo (requiere scope 'name') */
  name?: NombreClaveUnica;
  /** Email (requiere scope 'email') */
  email?: string;
}

/**
 * Token Set de ClaveÚnica
 */
export interface ClaveUnicaTokenSet {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  scope: string;
}

/**
 * Scopes disponibles en ClaveÚnica
 */
export type ClaveUnicaScope = 'openid' | 'run' | 'name' | 'email';

/**
 * Configuración del cliente ClaveÚnica
 */
export interface ClaveUnicaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  issuer: string;
  scopes: ClaveUnicaScope[];
}

/**
 * Resultado de autenticación exitosa
 */
export interface AuthenticationResult {
  /** RUN formateado (ej: "12345678-9") */
  run: string;
  /** RUN sin formato (ej: "123456789") */
  runSinFormato: string;
  /** Nombres del ciudadano */
  nombres: string;
  /** Apellido paterno */
  apellidoPaterno: string;
  /** Apellido materno */
  apellidoMaterno: string;
  /** Nombre completo */
  nombreCompleto: string;
  /** Email si está disponible */
  email?: string;
  /** Token de acceso */
  accessToken: string;
  /** Token de ID */
  idToken: string;
  /** Token de refresco */
  refreshToken?: string;
  /** Expiración en segundos */
  expiresIn: number;
}

/**
 * Estado de la sesión del usuario
 */
export interface UserSessionState {
  /** ID único de sesión */
  sessionId: string;
  /** RUN del usuario */
  run: string;
  /** Nombre completo */
  nombreCompleto: string;
  /** Timestamp de creación */
  createdAt: Date;
  /** Timestamp de última actividad */
  lastActivity: Date;
  /** IP de origen */
  ipAddress: string;
  /** User Agent */
  userAgent: string;
  /** ID Token para logout */
  idToken: string;
  /** Estado activo */
  isActive: boolean;
}

/**
 * Errores específicos de ClaveÚnica
 */
export enum ClaveUnicaErrorCode {
  /** Usuario canceló la autenticación */
  ACCESS_DENIED = 'access_denied',
  /** Error del servidor de ClaveÚnica */
  SERVER_ERROR = 'server_error',
  /** Sesión expirada */
  SESSION_EXPIRED = 'session_expired',
  /** Token inválido */
  INVALID_TOKEN = 'invalid_token',
  /** Estado CSRF inválido */
  INVALID_STATE = 'invalid_state',
  /** Configuración incompleta */
  NOT_CONFIGURED = 'not_configured',
}
