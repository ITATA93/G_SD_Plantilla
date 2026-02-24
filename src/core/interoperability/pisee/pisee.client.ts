/**
 * Cliente PISEE 2.0
 *
 * Plataforma de Integracion de Servicios Electronicos del Estado.
 * Permite el intercambio de datos entre instituciones publicas.
 *
 * Documentacion: https://digital.gob.cl/transformacion-digital/estandares-y-guias/
 *
 * @module core/interoperability/pisee
 */

import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';
import { auditLog } from '../../audit/services/audit.service.js';
import { AppError } from '../../../shared/utils/errors.js';

export interface PISEERequest {
  service: string;
  operation: string;
  data: Record<string, unknown>;
  metadata?: {
    requestId?: string;
    timestamp?: Date;
  };
}

export interface PISEEResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
  };
}

class PISEEClient {
  private baseUrl: string;
  private apiKey: string;
  private institutionId: string;

  constructor() {
    this.baseUrl = config.pisee.apiUrl || '';
    this.apiKey = config.pisee.apiKey || '';
    this.institutionId = config.pisee.institutionId || '';
  }

  /**
   * Verifica si el cliente esta configurado
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey && this.institutionId);
  }

  /**
   * Realiza una solicitud a un servicio PISEE
   */
  async request<T>(params: PISEERequest): Promise<PISEEResponse<T>> {
    if (!this.isConfigured()) {
      throw new AppError('PISEE no esta configurado', 500, 'PISEE_NOT_CONFIGURED');
    }

    const requestId = params.metadata?.requestId || crypto.randomUUID();
    const startTime = Date.now();

    // Log de solicitud saliente
    await auditLog({
      action: 'INTEROP_PISEE_REQUEST',
      details: {
        service: params.service,
        operation: params.operation,
        requestId,
      },
    });

    try {
      const response = await fetch(`${this.baseUrl}/${params.service}/${params.operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Institution-ID': this.institutionId,
          'X-Request-ID': requestId,
        },
        body: JSON.stringify(params.data),
      });

      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      const result: PISEEResponse<T> = {
        success: response.ok,
        data: response.ok ? responseData : undefined,
        error: !response.ok ? responseData : undefined,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime,
        },
      };

      // Log de respuesta
      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          requestId,
          service: params.service,
          operation: params.operation,
          success: result.success,
          processingTime,
        },
        result: result.success ? 'success' : 'failure',
      });

      logger.info('PISEE: Solicitud completada', {
        requestId,
        service: params.service,
        operation: params.operation,
        success: result.success,
        processingTime,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          requestId,
          service: params.service,
          operation: params.operation,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      logger.error('PISEE: Error en solicitud', {
        requestId,
        service: params.service,
        operation: params.operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      });

      throw new AppError(
        'Error al comunicarse con PISEE',
        502,
        'PISEE_CONNECTION_ERROR'
      );
    }
  }

  /**
   * Consulta datos de una persona por RUN (servicio comun)
   */
  async consultarPersona(run: string): Promise<PISEEResponse<{
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string;
  }>> {
    return this.request({
      service: 'registro-civil',
      operation: 'consultar-persona',
      data: { run },
    });
  }

  /**
   * Verifica vigencia de un documento
   */
  async verificarDocumento(tipoDocumento: string, numeroDocumento: string): Promise<PISEEResponse<{
    vigente: boolean;
    fechaEmision: string;
    fechaVencimiento?: string;
  }>> {
    return this.request({
      service: 'documentos',
      operation: 'verificar-vigencia',
      data: { tipoDocumento, numeroDocumento },
    });
  }
}

export const piseeClient = new PISEEClient();
