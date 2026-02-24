/**
 * Servicio de Gestion de Sesiones
 *
 * Maneja sesiones de usuario usando Redis para alta disponibilidad
 * y cumplimiento de requisitos de seguridad.
 *
 * @module core/auth/services/session
 */

import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';

export interface UserSession {
  id: string;
  run: string;
  nombres: string;
  apellidos: string;
  idToken: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface TempAuthData {
  nonce: string;
  returnUrl?: string;
}

class SessionService {
  private redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly TEMP_AUTH_PREFIX = 'temp_auth:';
  private readonly SESSION_TTL: number;

  constructor() {
    this.redis = new Redis(config.redis.url);
    this.SESSION_TTL = config.redis.sessionTtl;

    this.redis.on('error', (err) => {
      logger.error('Redis: Error de conexion', { error: err.message });
    });

    this.redis.on('connect', () => {
      logger.info('Redis: Conexion establecida');
    });
  }

  /**
   * Crea una nueva sesion de usuario
   */
  async createSession(userData: {
    run: string;
    nombres: string;
    apellidos: string;
    idToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession> {
    const session: UserSession = {
      id: uuidv4(),
      run: userData.run,
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      idToken: userData.idToken,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
    };

    await this.redis.setex(
      `${this.SESSION_PREFIX}${session.id}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    );

    // Registrar sesion activa del usuario (para invalidar todas si es necesario)
    await this.redis.sadd(`user_sessions:${userData.run}`, session.id);

    logger.info('Sesion creada', { sessionId: session.id, run: this.maskRun(userData.run) });

    return session;
  }

  /**
   * Obtiene una sesion por su ID
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const data = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data) as UserSession;

    // Actualizar ultima actividad
    session.lastActivity = new Date();
    await this.redis.setex(
      `${this.SESSION_PREFIX}${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    );

    return session;
  }

  /**
   * Destruye una sesion
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      await this.redis.srem(`user_sessions:${session.run}`, sessionId);
      logger.info('Sesion destruida', { sessionId });
    }
  }

  /**
   * Destruye todas las sesiones de un usuario
   * Util para logout global o revocacion de acceso
   */
  async destroyAllUserSessions(run: string): Promise<void> {
    const sessionIds = await this.redis.smembers(`user_sessions:${run}`);

    for (const sessionId of sessionIds) {
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
    }

    await this.redis.del(`user_sessions:${run}`);
    logger.info('Todas las sesiones destruidas', { run: this.maskRun(run), count: sessionIds.length });
  }

  /**
   * Guarda datos temporales de autenticacion (state, nonce)
   */
  async setTempAuth(state: string, data: TempAuthData): Promise<void> {
    await this.redis.setex(
      `${this.TEMP_AUTH_PREFIX}${state}`,
      300, // 5 minutos
      JSON.stringify(data)
    );
  }

  /**
   * Obtiene datos temporales de autenticacion
   */
  async getTempAuth(state: string): Promise<TempAuthData | null> {
    const data = await this.redis.get(`${this.TEMP_AUTH_PREFIX}${state}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Elimina datos temporales de autenticacion
   */
  async deleteTempAuth(state: string): Promise<void> {
    await this.redis.del(`${this.TEMP_AUTH_PREFIX}${state}`);
  }

  private maskRun(run: string): string {
    const parts = run.split('-');
    if (parts.length !== 2) return '***';
    const numero = parts[0];
    return `${numero.slice(0, 2)}***${numero.slice(-2)}-${parts[1]}`;
  }
}

export const sessionService = new SessionService();
