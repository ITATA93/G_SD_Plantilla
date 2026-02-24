/**
 * Cliente HL7 FHIR R4
 *
 * Implementacion del estandar HL7 FHIR R4 para interoperabilidad
 * en salud segun lineamientos del MINSAL.
 *
 * Documentacion:
 * - https://interoperabilidad.minsal.cl/
 * - https://hl7chile.cl/
 *
 * @module core/interoperability/fhir
 */

import Client from 'fhir-kit-client';
import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';
import { auditLog } from '../../audit/services/audit.service.js';
import { AppError } from '../../../shared/utils/errors.js';

// Tipos FHIR basicos
export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family: string;
    given: string[];
  }>;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

export interface FHIRBundle<T extends FHIRResource = FHIRResource> {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    resource: T;
  }>;
}

class FHIRClient {
  private client: Client | null = null;

  /**
   * Inicializa el cliente FHIR
   */
  private async getClient(): Promise<Client> {
    if (this.client) return this.client;

    if (!config.fhir.serverUrl) {
      throw new AppError('FHIR no esta configurado', 500, 'FHIR_NOT_CONFIGURED');
    }

    this.client = new Client({
      baseUrl: config.fhir.serverUrl,
    });

    // Configurar autenticacion si esta disponible
    if (config.fhir.clientId && config.fhir.clientSecret) {
      // Implementar OAuth2 client credentials si es necesario
      logger.info('FHIR: Cliente inicializado con autenticacion');
    } else {
      logger.info('FHIR: Cliente inicializado sin autenticacion');
    }

    return this.client;
  }

  /**
   * Verifica si el cliente esta configurado
   */
  isConfigured(): boolean {
    return !!config.fhir.serverUrl;
  }

  /**
   * Busca un paciente por RUN (usando el sistema de identificadores chileno)
   */
  async searchPatientByRun(run: string): Promise<FHIRPatient | null> {
    const client = await this.getClient();
    const requestId = crypto.randomUUID();

    await auditLog({
      action: 'INTEROP_FHIR_REQUEST',
      details: {
        operation: 'searchPatient',
        identifier: this.maskRun(run),
        requestId,
      },
    });

    try {
      const response = await client.search({
        resourceType: 'Patient',
        searchParams: {
          identifier: `urn:oid:2.16.152.1.2.1.1|${run}`, // OID Chile RUN
        },
      }) as FHIRBundle<FHIRPatient>;

      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'searchPatient',
          found: (response.total || 0) > 0,
          requestId,
        },
        result: 'success',
      });

      if (response.entry && response.entry.length > 0) {
        return response.entry[0].resource;
      }

      return null;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'searchPatient',
          requestId,
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      logger.error('FHIR: Error al buscar paciente', { error, requestId });
      throw new AppError('Error al consultar servidor FHIR', 502, 'FHIR_ERROR');
    }
  }

  /**
   * Obtiene un recurso por ID
   */
  async read<T extends FHIRResource>(
    resourceType: string,
    id: string
  ): Promise<T> {
    const client = await this.getClient();
    const requestId = crypto.randomUUID();

    await auditLog({
      action: 'INTEROP_FHIR_REQUEST',
      details: {
        operation: 'read',
        resourceType,
        resourceId: id,
        requestId,
      },
    });

    try {
      const resource = await client.read({
        resourceType,
        id,
      }) as T;

      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'read',
          resourceType,
          resourceId: id,
          requestId,
        },
        result: 'success',
      });

      return resource;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'read',
          resourceType,
          resourceId: id,
          requestId,
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      throw new AppError('Error al leer recurso FHIR', 502, 'FHIR_ERROR');
    }
  }

  /**
   * Crea un nuevo recurso
   */
  async create<T extends FHIRResource>(resource: T): Promise<T> {
    const client = await this.getClient();
    const requestId = crypto.randomUUID();

    await auditLog({
      action: 'INTEROP_FHIR_REQUEST',
      details: {
        operation: 'create',
        resourceType: resource.resourceType,
        requestId,
      },
    });

    try {
      const created = await client.create({
        resourceType: resource.resourceType,
        body: resource,
      }) as T;

      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'create',
          resourceType: resource.resourceType,
          resourceId: created.id,
          requestId,
        },
        result: 'success',
      });

      logger.info('FHIR: Recurso creado', {
        resourceType: resource.resourceType,
        id: created.id,
      });

      return created;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'create',
          resourceType: resource.resourceType,
          requestId,
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      throw new AppError('Error al crear recurso FHIR', 502, 'FHIR_ERROR');
    }
  }

  /**
   * Actualiza un recurso existente
   */
  async update<T extends FHIRResource>(resource: T): Promise<T> {
    const client = await this.getClient();
    const requestId = crypto.randomUUID();

    if (!resource.id) {
      throw new AppError('El recurso debe tener un ID para actualizar', 400);
    }

    await auditLog({
      action: 'INTEROP_FHIR_REQUEST',
      details: {
        operation: 'update',
        resourceType: resource.resourceType,
        resourceId: resource.id,
        requestId,
      },
    });

    try {
      const updated = await client.update({
        resourceType: resource.resourceType,
        id: resource.id,
        body: resource,
      }) as T;

      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'update',
          resourceType: resource.resourceType,
          resourceId: resource.id,
          requestId,
        },
        result: 'success',
      });

      return updated;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_FHIR_RESPONSE',
        details: {
          operation: 'update',
          resourceType: resource.resourceType,
          resourceId: resource.id,
          requestId,
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      throw new AppError('Error al actualizar recurso FHIR', 502, 'FHIR_ERROR');
    }
  }

  private maskRun(run: string): string {
    const parts = run.split('-');
    if (parts.length !== 2) return '***';
    const numero = parts[0];
    return `${numero.slice(0, 2)}***${numero.slice(-2)}-${parts[1]}`;
  }
}

export const fhirClient = new FHIRClient();
