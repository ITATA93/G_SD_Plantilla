/**
 * Servicio de Autenticacion con ClaveUnica
 *
 * Implementa la integracion con ClaveUnica del Estado de Chile
 * usando el protocolo OpenID Connect.
 *
 * Documentacion oficial:
 * https://digital.gob.cl/transformacion-digital/estandares-y-guias/
 *
 * @module core/auth/services/claveunica
 */

import { Issuer, Client, generators } from 'openid-client';
import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';
import { AppError } from '../../../shared/utils/errors.js';

export interface ClaveUnicaUserInfo {
  sub: string;           // Identificador unico
  RolUnico: {
    numero: number;      // RUN sin digito verificador
    DV: string;          // Digito verificador
    tipo: string;        // Tipo de documento
  };
  name?: {
    nombres: string[];
    apellidos: string[];
  };
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresIn: number;
  user: {
    run: string;
    nombres: string;
    apellidos: string;
  };
}

class ClaveUnicaService {
  private client: Client | null = null;
  private issuer: Issuer | null = null;

  /**
   * Inicializa el cliente OpenID Connect con ClaveUnica
   */
  async initialize(): Promise<void> {
    if (this.client) return;

    try {
      this.issuer = await Issuer.discover(config.claveUnica.issuer!);

      this.client = new this.issuer.Client({
        client_id: config.claveUnica.clientId!,
        client_secret: config.claveUnica.clientSecret!,
        redirect_uris: [config.claveUnica.redirectUri!],
        response_types: ['code'],
      });

      logger.info('ClaveUnica: Cliente OpenID Connect inicializado');
    } catch (error) {
      logger.error('ClaveUnica: Error al inicializar cliente', { error });
      throw new AppError('Error al conectar con ClaveUnica', 500);
    }
  }

  /**
   * Genera la URL de autorizacion para redirigir al usuario
   */
  async getAuthorizationUrl(state?: string): Promise<{ url: string; state: string; nonce: string }> {
    await this.initialize();

    const generatedState = state || generators.state();
    const nonce = generators.nonce();

    const url = this.client!.authorizationUrl({
      scope: config.claveUnica.scopes.join(' '),
      state: generatedState,
      nonce,
    });

    logger.info('ClaveUnica: URL de autorizacion generada');

    return { url, state: generatedState, nonce };
  }

  /**
   * Intercambia el codigo de autorizacion por tokens
   */
  async handleCallback(
    code: string,
    state: string,
    expectedState: string,
    nonce: string
  ): Promise<AuthResult> {
    await this.initialize();

    // Validar state para prevenir CSRF
    if (state !== expectedState) {
      throw new AppError('Estado de autorizacion invalido', 400);
    }

    try {
      const tokenSet = await this.client!.callback(
        config.claveUnica.redirectUri!,
        { code, state },
        { state: expectedState, nonce }
      );

      // Obtener informacion del usuario
      const userInfo = await this.client!.userinfo<ClaveUnicaUserInfo>(tokenSet);

      const run = `${userInfo.RolUnico.numero}-${userInfo.RolUnico.DV}`;
      const nombres = userInfo.name?.nombres?.join(' ') || '';
      const apellidos = userInfo.name?.apellidos?.join(' ') || '';

      logger.info('ClaveUnica: Autenticacion exitosa', { run: this.maskRun(run) });

      return {
        accessToken: tokenSet.access_token!,
        refreshToken: tokenSet.refresh_token,
        idToken: tokenSet.id_token!,
        expiresIn: tokenSet.expires_in || 3600,
        user: {
          run,
          nombres,
          apellidos,
        },
      };
    } catch (error) {
      logger.error('ClaveUnica: Error en callback', { error });
      throw new AppError('Error al procesar autenticacion', 500);
    }
  }

  /**
   * Genera la URL de cierre de sesion
   */
  async getLogoutUrl(idToken: string, postLogoutRedirectUri?: string): Promise<string> {
    await this.initialize();

    return this.client!.endSessionUrl({
      id_token_hint: idToken,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });
  }

  /**
   * Enmascara el RUN para logging seguro
   */
  private maskRun(run: string): string {
    const parts = run.split('-');
    if (parts.length !== 2) return '***';
    const numero = parts[0];
    return `${numero.slice(0, 2)}***${numero.slice(-2)}-${parts[1]}`;
  }
}

export const claveUnicaService = new ClaveUnicaService();
