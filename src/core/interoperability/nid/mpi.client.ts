/**
 * Cliente MPI - Master Patient Index
 *
 * Integración con el Índice Maestro de Pacientes del MINSAL.
 * Parte del Núcleo de Interoperabilidad de Datos (NID).
 *
 * El MPI permite:
 * - Identificación única de pacientes a nivel nacional
 * - Búsqueda de pacientes por RUN u otros identificadores
 * - Vinculación de registros entre instituciones
 *
 * @module core/interoperability/nid/mpi
 */

import { config } from '../../../config/environment.js';
import { logger } from '../../../shared/utils/logger.js';
import { auditLog } from '../../audit/services/audit.service.js';
import { AppError } from '../../../shared/utils/errors.js';

/**
 * Identificador de paciente
 */
export interface IdentificadorPaciente {
  /** Sistema de identificación (ej: urn:oid:2.16.152.1.2.1.1 para RUN) */
  system: string;
  /** Valor del identificador */
  value: string;
  /** Tipo de identificador */
  type?: 'RUN' | 'PASAPORTE' | 'DNI_EXTRANJERO' | 'OTRO';
}

/**
 * Dirección del paciente
 */
export interface DireccionPaciente {
  calle: string;
  numero?: string;
  departamento?: string;
  comuna: string;
  region: string;
  codigoPostal?: string;
  pais: string;
}

/**
 * Paciente en el MPI
 */
export interface PacienteMPI {
  /** ID único en el MPI */
  mpiId: string;
  /** Identificadores del paciente */
  identificadores: IdentificadorPaciente[];
  /** Nombres */
  nombres: string[];
  /** Apellido paterno */
  apellidoPaterno: string;
  /** Apellido materno */
  apellidoMaterno?: string;
  /** Fecha de nacimiento */
  fechaNacimiento: Date;
  /** Género */
  genero: 'masculino' | 'femenino' | 'otro' | 'desconocido';
  /** Direcciones */
  direcciones?: DireccionPaciente[];
  /** Teléfonos */
  telefonos?: string[];
  /** Emails */
  emails?: string[];
  /** Estado activo */
  activo: boolean;
  /** Fecha de última actualización */
  ultimaActualizacion: Date;
}

/**
 * Resultado de búsqueda en MPI
 */
export interface ResultadoBusquedaMPI {
  /** Pacientes encontrados */
  pacientes: PacienteMPI[];
  /** Total de resultados */
  total: number;
  /** Indica si hay más resultados */
  hayMas: boolean;
}

/**
 * Parámetros de búsqueda
 */
export interface ParametrosBusquedaMPI {
  /** RUN del paciente */
  run?: string;
  /** Nombres */
  nombres?: string;
  /** Apellidos */
  apellidos?: string;
  /** Fecha de nacimiento */
  fechaNacimiento?: Date;
  /** Género */
  genero?: string;
  /** Límite de resultados */
  limite?: number;
  /** Offset para paginación */
  offset?: number;
}

class MPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.MPI_API_URL || '';
    this.apiKey = process.env.MPI_API_KEY || '';
  }

  /**
   * Verifica si el cliente está configurado
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  /**
   * Busca un paciente por RUN
   */
  async buscarPorRun(run: string): Promise<PacienteMPI | null> {
    if (!this.isConfigured()) {
      logger.warn('MPI no configurado, retornando null');
      return null;
    }

    const requestId = crypto.randomUUID();

    await auditLog({
      action: 'INTEROP_PISEE_REQUEST',
      details: {
        servicio: 'MPI',
        operacion: 'buscarPorRun',
        requestId,
      },
    });

    try {
      const response = await fetch(`${this.baseUrl}/Patient?identifier=${encodeURIComponent(`urn:oid:2.16.152.1.2.1.1|${run}`)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/fhir+json',
          'X-Request-ID': requestId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error MPI: ${response.status}`);
      }

      const bundle = await response.json();

      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          servicio: 'MPI',
          operacion: 'buscarPorRun',
          requestId,
          encontrado: bundle.total > 0,
        },
        result: 'success',
      });

      if (bundle.entry && bundle.entry.length > 0) {
        return this.mapearFHIRaPaciente(bundle.entry[0].resource);
      }

      return null;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          servicio: 'MPI',
          operacion: 'buscarPorRun',
          requestId,
        },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      logger.error('Error al consultar MPI', { error, requestId });
      throw new AppError('Error al consultar el Índice Maestro de Pacientes', 502);
    }
  }

  /**
   * Busca pacientes con múltiples criterios
   */
  async buscar(params: ParametrosBusquedaMPI): Promise<ResultadoBusquedaMPI> {
    if (!this.isConfigured()) {
      return { pacientes: [], total: 0, hayMas: false };
    }

    const requestId = crypto.randomUUID();
    const queryParams = new URLSearchParams();

    if (params.run) {
      queryParams.append('identifier', `urn:oid:2.16.152.1.2.1.1|${params.run}`);
    }
    if (params.nombres) {
      queryParams.append('given', params.nombres);
    }
    if (params.apellidos) {
      queryParams.append('family', params.apellidos);
    }
    if (params.fechaNacimiento) {
      queryParams.append('birthdate', params.fechaNacimiento.toISOString().split('T')[0]);
    }
    if (params.genero) {
      queryParams.append('gender', params.genero);
    }
    if (params.limite) {
      queryParams.append('_count', params.limite.toString());
    }
    if (params.offset) {
      queryParams.append('_offset', params.offset.toString());
    }

    await auditLog({
      action: 'INTEROP_PISEE_REQUEST',
      details: {
        servicio: 'MPI',
        operacion: 'buscar',
        requestId,
        parametros: Object.fromEntries(queryParams),
      },
    });

    try {
      const response = await fetch(`${this.baseUrl}/Patient?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/fhir+json',
          'X-Request-ID': requestId,
        },
      });

      if (!response.ok) {
        throw new Error(`Error MPI: ${response.status}`);
      }

      const bundle = await response.json();

      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          servicio: 'MPI',
          operacion: 'buscar',
          requestId,
          total: bundle.total,
        },
        result: 'success',
      });

      const pacientes = bundle.entry?.map((entry: any) =>
        this.mapearFHIRaPaciente(entry.resource)
      ) || [];

      return {
        pacientes,
        total: bundle.total || 0,
        hayMas: bundle.link?.some((l: any) => l.relation === 'next') || false,
      };
    } catch (error) {
      logger.error('Error en búsqueda MPI', { error, requestId });
      throw new AppError('Error al buscar en el Índice Maestro de Pacientes', 502);
    }
  }

  /**
   * Mapea un recurso FHIR Patient a PacienteMPI
   */
  private mapearFHIRaPaciente(fhirPatient: any): PacienteMPI {
    const identificadores: IdentificadorPaciente[] = (fhirPatient.identifier || []).map((id: any) => ({
      system: id.system,
      value: id.value,
      type: this.determinarTipoIdentificador(id.system),
    }));

    const nombres = fhirPatient.name?.[0]?.given || [];
    const apellidos = fhirPatient.name?.[0]?.family?.split(' ') || [''];

    return {
      mpiId: fhirPatient.id,
      identificadores,
      nombres,
      apellidoPaterno: apellidos[0] || '',
      apellidoMaterno: apellidos[1],
      fechaNacimiento: new Date(fhirPatient.birthDate),
      genero: this.mapearGenero(fhirPatient.gender),
      direcciones: this.mapearDirecciones(fhirPatient.address),
      telefonos: fhirPatient.telecom?.filter((t: any) => t.system === 'phone').map((t: any) => t.value) || [],
      emails: fhirPatient.telecom?.filter((t: any) => t.system === 'email').map((t: any) => t.value) || [],
      activo: fhirPatient.active !== false,
      ultimaActualizacion: new Date(fhirPatient.meta?.lastUpdated || new Date()),
    };
  }

  private determinarTipoIdentificador(system: string): IdentificadorPaciente['type'] {
    if (system.includes('2.16.152.1.2.1.1')) return 'RUN';
    if (system.includes('passport')) return 'PASAPORTE';
    return 'OTRO';
  }

  private mapearGenero(gender: string): PacienteMPI['genero'] {
    switch (gender) {
      case 'male': return 'masculino';
      case 'female': return 'femenino';
      case 'other': return 'otro';
      default: return 'desconocido';
    }
  }

  private mapearDirecciones(addresses: any[]): DireccionPaciente[] {
    if (!addresses) return [];

    return addresses.map(addr => ({
      calle: addr.line?.[0] || '',
      numero: addr.line?.[1],
      comuna: addr.city || '',
      region: addr.state || '',
      codigoPostal: addr.postalCode,
      pais: addr.country || 'Chile',
    }));
  }
}

export const mpiClient = new MPIClient();
