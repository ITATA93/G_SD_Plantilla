/**
 * claveunica.test.ts - Tests de integracion para ClaveUnica
 *
 * Valida la integracion con ClaveUnica (OpenID Connect) usando mocks.
 * Los endpoints reales requieren credenciales de ambiente, por lo que
 * estos tests simulan las respuestas del proveedor de identidad.
 *
 * Flujo testeado:
 *   1. Redireccion a ClaveUnica (authorization URL)
 *   2. Manejo del callback con code + state
 *   3. Intercambio de tokens (token exchange)
 *   4. Obtencion del perfil de usuario (userinfo)
 *   5. Escenarios de error (state invalido, token expirado, etc.)
 *
 * Normativas relacionadas:
 *   - Ley 21.658 (Secretaria de Gobierno Digital - ClaveUnica)
 *   - OpenID Connect Core 1.0
 *
 * USAGE:
 *   npx vitest tests/integration/claveunica.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks: simulamos las dependencias externas antes de importar el servicio
// ---------------------------------------------------------------------------

// Mock de openid-client
const mockAuthorizationUrl = vi.fn();
const mockCallback = vi.fn();
const mockUserinfo = vi.fn();
const mockEndSessionUrl = vi.fn();

const mockClientInstance = {
  authorizationUrl: mockAuthorizationUrl,
  callback: mockCallback,
  userinfo: mockUserinfo,
  endSessionUrl: mockEndSessionUrl,
};

vi.mock('openid-client', () => ({
  Issuer: {
    discover: vi.fn().mockResolvedValue({
      Client: vi.fn().mockImplementation(() => mockClientInstance),
    }),
  },
  Client: vi.fn(),
  generators: {
    state: vi.fn().mockReturnValue('mock-state-abc123'),
    nonce: vi.fn().mockReturnValue('mock-nonce-xyz789'),
  },
}));

// Mock de config
vi.mock('../../src/config/environment.js', () => ({
  config: {
    claveUnica: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
      issuer: 'https://accounts.claveunica.gob.cl/openid',
      scopes: ['openid', 'run', 'name'],
    },
    nodeEnv: 'development',
  },
}));

// Mock de logger
vi.mock('../../src/shared/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

/** Respuesta simulada de ClaveUnica userinfo */
const MOCK_CLAVEUNICA_USER = {
  sub: 'claveunica-sub-12345678',
  RolUnico: {
    numero: 12345678,
    DV: '9',
    tipo: 'RUN',
  },
  name: {
    nombres: ['Juan', 'Carlos'],
    apellidos: ['Perez', 'Gonzalez'],
  },
};

/** Token set simulado retornado por ClaveUnica */
const MOCK_TOKEN_SET = {
  access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token',
  id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock-id-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid run name',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClaveUnica Service - Integracion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar respuestas por defecto
    mockAuthorizationUrl.mockReturnValue(
      'https://accounts.claveunica.gob.cl/openid/authorize?response_type=code&client_id=test-client-id&scope=openid+run+name&state=mock-state-abc123&nonce=mock-nonce-xyz789'
    );
    mockCallback.mockResolvedValue(MOCK_TOKEN_SET);
    mockUserinfo.mockResolvedValue(MOCK_CLAVEUNICA_USER);
    mockEndSessionUrl.mockReturnValue(
      'https://accounts.claveunica.gob.cl/openid/logout?id_token_hint=mock-id-token'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Redireccion a ClaveUnica
  // -----------------------------------------------------------------------
  describe('getAuthorizationUrl - Redireccion a ClaveUnica', () => {
    it('genera una URL de autorizacion valida con parametros OAuth2', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.getAuthorizationUrl();

      expect(result).toBeDefined();
      expect(result.url).toContain('accounts.claveunica.gob.cl');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('scope=openid');
      expect(result.state).toBeTruthy();
      expect(result.nonce).toBeTruthy();
    });

    it('incluye state y nonce para prevencion CSRF', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.getAuthorizationUrl();

      expect(result.state).toBe('mock-state-abc123');
      expect(result.nonce).toBe('mock-nonce-xyz789');
      expect(result.url).toContain('state=mock-state-abc123');
      expect(result.url).toContain('nonce=mock-nonce-xyz789');
    });

    it('permite pasar un state personalizado', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const customState = 'custom-state-value';
      const result = await claveUnicaService.getAuthorizationUrl(customState);

      expect(result.state).toBe(customState);
    });

    it('incluye los scopes requeridos (openid, run, name)', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.getAuthorizationUrl();

      // El scope debe incluir openid (requerido por OIDC) y run (RUN del ciudadano)
      expect(result.url).toContain('openid');
      expect(result.url).toContain('run');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Callback - Manejo del retorno desde ClaveUnica
  // -----------------------------------------------------------------------
  describe('handleCallback - Procesamiento del callback', () => {
    it('intercambia el codigo de autorizacion por tokens', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-123',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      expect(mockCallback).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback',
        { code: 'auth-code-123', state: 'mock-state-abc123' },
        { state: 'mock-state-abc123', nonce: 'mock-nonce-xyz789' }
      );

      expect(result.accessToken).toBe(MOCK_TOKEN_SET.access_token);
      expect(result.idToken).toBe(MOCK_TOKEN_SET.id_token);
    });

    it('obtiene el perfil de usuario con RUN formateado', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-123',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      // El RUN debe estar formateado como "numero-DV"
      expect(result.user.run).toBe('12345678-9');
      expect(result.user.nombres).toBe('Juan Carlos');
      expect(result.user.apellidos).toBe('Perez Gonzalez');
    });

    it('incluye token de refresco si esta disponible', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-123',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.expiresIn).toBe(3600);
    });

    it('maneja usuario sin nombres (solo RUN)', async () => {
      mockUserinfo.mockResolvedValueOnce({
        sub: 'claveunica-sub-99999999',
        RolUnico: {
          numero: 99999999,
          DV: 'K',
          tipo: 'RUN',
        },
        // Sin campo "name"
      });

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-456',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      expect(result.user.run).toBe('99999999-K');
      expect(result.user.nombres).toBe('');
      expect(result.user.apellidos).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // 3. Token Exchange - Validaciones
  // -----------------------------------------------------------------------
  describe('Token Exchange - Validaciones de seguridad', () => {
    it('rechaza callback con state invalido (proteccion CSRF)', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await expect(
        claveUnicaService.handleCallback(
          'auth-code-123',
          'state-incorrecto',
          'mock-state-abc123', // state esperado diferente
          'mock-nonce-xyz789'
        )
      ).rejects.toThrow('Estado de autorizacion invalido');
    });

    it('propaga error cuando ClaveUnica rechaza el codigo', async () => {
      mockCallback.mockRejectedValueOnce(
        new Error('invalid_grant: Authorization code expired')
      );

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await expect(
        claveUnicaService.handleCallback(
          'codigo-expirado',
          'mock-state-abc123',
          'mock-state-abc123',
          'mock-nonce-xyz789'
        )
      ).rejects.toThrow('Error al procesar autenticacion');
    });

    it('propaga error cuando userinfo falla', async () => {
      mockUserinfo.mockRejectedValueOnce(
        new Error('invalid_token: Token has been revoked')
      );

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await expect(
        claveUnicaService.handleCallback(
          'auth-code-789',
          'mock-state-abc123',
          'mock-state-abc123',
          'mock-nonce-xyz789'
        )
      ).rejects.toThrow('Error al procesar autenticacion');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Perfil de usuario - Extraccion de datos
  // -----------------------------------------------------------------------
  describe('Perfil de usuario - Extraccion de datos ClaveUnica', () => {
    it('extrae correctamente el RUN con digito verificador', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-123',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      // Formato esperado: numero-DV
      expect(result.user.run).toMatch(/^\d+-[\dkK]$/);
    });

    it('concatena multiples nombres correctamente', async () => {
      mockUserinfo.mockResolvedValueOnce({
        sub: 'sub-test',
        RolUnico: { numero: 11111111, DV: '1', tipo: 'RUN' },
        name: {
          nombres: ['Maria', 'Isabel', 'Fernanda'],
          apellidos: ['Lopez', 'Diaz'],
        },
      });

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const result = await claveUnicaService.handleCallback(
        'auth-code-123',
        'mock-state-abc123',
        'mock-state-abc123',
        'mock-nonce-xyz789'
      );

      expect(result.user.nombres).toBe('Maria Isabel Fernanda');
      expect(result.user.apellidos).toBe('Lopez Diaz');
    });
  });

  // -----------------------------------------------------------------------
  // 5. Logout - Cierre de sesion
  // -----------------------------------------------------------------------
  describe('getLogoutUrl - Cierre de sesion en ClaveUnica', () => {
    it('genera URL de logout con id_token_hint', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      const logoutUrl = await claveUnicaService.getLogoutUrl('mock-id-token');

      expect(logoutUrl).toContain('accounts.claveunica.gob.cl');
      expect(logoutUrl).toContain('id_token_hint=mock-id-token');
    });

    it('invoca endSessionUrl del cliente OIDC', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await claveUnicaService.getLogoutUrl('test-id-token', 'http://localhost:3000');

      expect(mockEndSessionUrl).toHaveBeenCalledWith({
        id_token_hint: 'test-id-token',
        post_logout_redirect_uri: 'http://localhost:3000',
      });
    });
  });

  // -----------------------------------------------------------------------
  // 6. Escenarios de error
  // -----------------------------------------------------------------------
  describe('Escenarios de error', () => {
    it('maneja error de red al conectar con ClaveUnica (discovery)', async () => {
      // Forzar re-import con discovery fallido
      vi.resetModules();
      vi.doMock('openid-client', () => ({
        Issuer: {
          discover: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        },
        Client: vi.fn(),
        generators: {
          state: vi.fn().mockReturnValue('s'),
          nonce: vi.fn().mockReturnValue('n'),
        },
      }));

      vi.doMock('../../src/config/environment.js', () => ({
        config: {
          claveUnica: {
            clientId: 'test',
            clientSecret: 'test',
            redirectUri: 'http://localhost:3000/auth/callback',
            issuer: 'https://accounts.claveunica.gob.cl/openid',
            scopes: ['openid', 'run'],
          },
        },
      }));

      vi.doMock('../../src/shared/utils/logger.js', () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
      }));

      const mod = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await expect(
        mod.claveUnicaService.getAuthorizationUrl()
      ).rejects.toThrow('Error al conectar con ClaveUnica');
    });

    it('maneja timeout en la conexion a ClaveUnica', async () => {
      mockCallback.mockRejectedValueOnce(
        new Error('ETIMEDOUT: Connection timed out')
      );

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      await expect(
        claveUnicaService.handleCallback(
          'auth-code',
          'mock-state-abc123',
          'mock-state-abc123',
          'mock-nonce-xyz789'
        )
      ).rejects.toThrow();
    });

    it('no expone datos sensibles en mensajes de error', async () => {
      mockCallback.mockRejectedValueOnce(
        new Error('client_secret=xyz123 is invalid')
      );

      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      try {
        await claveUnicaService.handleCallback(
          'auth-code',
          'mock-state-abc123',
          'mock-state-abc123',
          'mock-nonce-xyz789'
        );
      } catch (error: any) {
        // El error expuesto no debe contener credenciales
        expect(error.message).not.toContain('client_secret');
        expect(error.message).not.toContain('xyz123');
        expect(error.message).toBe('Error al procesar autenticacion');
      }
    });
  });

  // -----------------------------------------------------------------------
  // 7. Inicializacion del servicio
  // -----------------------------------------------------------------------
  describe('Inicializacion del servicio', () => {
    it('inicializa el cliente OIDC con la configuracion correcta', async () => {
      const { claveUnicaService } = await import(
        '../../src/core/auth/services/claveunica.service.js'
      );

      // La inicializacion ocurre de forma lazy al llamar getAuthorizationUrl
      await claveUnicaService.getAuthorizationUrl();

      // El servicio debe haber llamado a Issuer.discover con el issuer correcto
      const { Issuer } = await import('openid-client');
      expect(Issuer.discover).toHaveBeenCalledWith(
        'https://accounts.claveunica.gob.cl/openid'
      );
    });
  });
});
