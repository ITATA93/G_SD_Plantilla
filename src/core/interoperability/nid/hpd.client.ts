/**
 * Cliente HPD - Healthcare Provider Directory
 *
 * Integración con el Directorio de Prestadores del MINSAL.
 * Parte del Núcleo de Interoperabilidad de Datos (NID).
 *
 * El HPD permite:
 * - Búsqueda de profesionales de salud
 * - Verificación de habilitación profesional
 * - Consulta de especialidades y lugares de atención
 *
 * @module core/interoperability/nid/hpd
 */

import { logger } from '../../../shared/utils/logger.js';
import { auditLog } from '../../audit/services/audit.service.js';
import { AppError } from '../../../shared/utils/errors.js';

/**
 * Profesional de salud
 */
export interface ProfesionalSalud {
  /** ID único en el HPD */
  hpdId: string;
  /** RUN del profesional */
  run: string;
  /** Nombres */
  nombres: string[];
  /** Apellido paterno */
  apellidoPaterno: string;
  /** Apellido materno */
  apellidoMaterno?: string;
  /** Título profesional */
  tituloProfesional: string;
  /** Universidad de egreso */
  universidad?: string;
  /** Especialidades */
  especialidades: Especialidad[];
  /** Registro en Superintendencia de Salud */
  registroSuperintendencia: string;
  /** Estado de habilitación */
  habilitado: boolean;
  /** Lugares de atención */
  lugaresAtencion: LugarAtencion[];
  /** Última actualización */
  ultimaActualizacion: Date;
}

/**
 * Especialidad médica
 */
export interface Especialidad {
  /** Código de especialidad */
  codigo: string;
  /** Nombre de la especialidad */
  nombre: string;
  /** Certificada por CONACEM */
  certificadaCONACEM: boolean;
  /** Fecha de certificación */
  fechaCertificacion?: Date;
}

/**
 * Lugar de atención
 */
export interface LugarAtencion {
  /** ID del establecimiento */
  establecimientoId: string;
  /** Nombre del establecimiento */
  nombre: string;
  /** Tipo de establecimiento */
  tipo: 'HOSPITAL' | 'CLINICA' | 'CESFAM' | 'CONSULTORIO' | 'OTRO';
  /** Dirección */
  direccion: string;
  /** Comuna */
  comuna: string;
  /** Región */
  region: string;
  /** Código DEIS */
  codigoDEIS?: string;
}

/**
 * Establecimiento de salud
 */
export interface EstablecimientoSalud {
  /** ID único */
  id: string;
  /** Código DEIS */
  codigoDEIS: string;
  /** Nombre */
  nombre: string;
  /** Tipo */
  tipo: string;
  /** Dependencia */
  dependencia: 'PUBLICO' | 'PRIVADO';
  /** Servicio de Salud (si es público) */
  servicioSalud?: string;
  /** Dirección */
  direccion: string;
  /** Comuna */
  comuna: string;
  /** Región */
  region: string;
  /** Teléfono */
  telefono?: string;
  /** Acreditado */
  acreditado: boolean;
  /** Nivel de complejidad */
  nivelComplejidad?: 'BAJA' | 'MEDIA' | 'ALTA';
}

class HPDClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.HPD_API_URL || '';
    this.apiKey = process.env.HPD_API_KEY || '';
  }

  /**
   * Verifica si el cliente está configurado
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }

  /**
   * Busca un profesional por RUN
   */
  async buscarProfesionalPorRun(run: string): Promise<ProfesionalSalud | null> {
    if (!this.isConfigured()) {
      logger.warn('HPD no configurado');
      return null;
    }

    const requestId = crypto.randomUUID();

    await auditLog({
      action: 'INTEROP_PISEE_REQUEST',
      details: {
        servicio: 'HPD',
        operacion: 'buscarProfesionalPorRun',
        requestId,
      },
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/Practitioner?identifier=${encodeURIComponent(`urn:oid:2.16.152.1.2.1.1|${run}`)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/fhir+json',
            'X-Request-ID': requestId,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error HPD: ${response.status}`);
      }

      const bundle = await response.json();

      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: {
          servicio: 'HPD',
          operacion: 'buscarProfesionalPorRun',
          requestId,
          encontrado: bundle.total > 0,
        },
        result: 'success',
      });

      if (bundle.entry && bundle.entry.length > 0) {
        return this.mapearFHIRaProfesional(bundle.entry[0].resource);
      }

      return null;
    } catch (error) {
      await auditLog({
        action: 'INTEROP_PISEE_RESPONSE',
        details: { servicio: 'HPD', operacion: 'buscarProfesionalPorRun', requestId },
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      });

      logger.error('Error al consultar HPD', { error, requestId });
      throw new AppError('Error al consultar el Directorio de Prestadores', 502);
    }
  }

  /**
   * Verifica si un profesional está habilitado para ejercer
   */
  async verificarHabilitacion(run: string): Promise<{
    habilitado: boolean;
    mensaje: string;
    profesional?: ProfesionalSalud;
  }> {
    const profesional = await this.buscarProfesionalPorRun(run);

    if (!profesional) {
      return {
        habilitado: false,
        mensaje: 'Profesional no encontrado en el registro',
      };
    }

    if (!profesional.habilitado) {
      return {
        habilitado: false,
        mensaje: 'Profesional no habilitado para ejercer',
        profesional,
      };
    }

    return {
      habilitado: true,
      mensaje: 'Profesional habilitado',
      profesional,
    };
  }

  /**
   * Busca establecimientos por comuna
   */
  async buscarEstablecimientosPorComuna(
    comuna: string,
    tipo?: string
  ): Promise<EstablecimientoSalud[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const requestId = crypto.randomUUID();
    const queryParams = new URLSearchParams({
      'address-city': comuna,
    });

    if (tipo) {
      queryParams.append('type', tipo);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Organization?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/fhir+json',
            'X-Request-ID': requestId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HPD: ${response.status}`);
      }

      const bundle = await response.json();

      return bundle.entry?.map((entry: any) =>
        this.mapearFHIRAEstablecimiento(entry.resource)
      ) || [];
    } catch (error) {
      logger.error('Error al buscar establecimientos', { error, requestId });
      throw new AppError('Error al buscar establecimientos de salud', 502);
    }
  }

  /**
   * Busca un establecimiento por código DEIS
   */
  async buscarEstablecimientoPorDEIS(codigoDEIS: string): Promise<EstablecimientoSalud | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const requestId = crypto.randomUUID();

    try {
      const response = await fetch(
        `${this.baseUrl}/Organization?identifier=${encodeURIComponent(`urn:oid:2.16.152.1.12.1|${codigoDEIS}`)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/fhir+json',
            'X-Request-ID': requestId,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error HPD: ${response.status}`);
      }

      const bundle = await response.json();

      if (bundle.entry && bundle.entry.length > 0) {
        return this.mapearFHIRAEstablecimiento(bundle.entry[0].resource);
      }

      return null;
    } catch (error) {
      logger.error('Error al buscar establecimiento por DEIS', { error, requestId });
      throw new AppError('Error al buscar establecimiento de salud', 502);
    }
  }

  private mapearFHIRaProfesional(fhirPractitioner: any): ProfesionalSalud {
    const nombres = fhirPractitioner.name?.[0]?.given || [];
    const apellidos = fhirPractitioner.name?.[0]?.family?.split(' ') || [''];

    const runIdentifier = fhirPractitioner.identifier?.find(
      (id: any) => id.system?.includes('2.16.152.1.2.1.1')
    );

    return {
      hpdId: fhirPractitioner.id,
      run: runIdentifier?.value || '',
      nombres,
      apellidoPaterno: apellidos[0] || '',
      apellidoMaterno: apellidos[1],
      tituloProfesional: fhirPractitioner.qualification?.[0]?.code?.text || '',
      universidad: fhirPractitioner.qualification?.[0]?.issuer?.display,
      especialidades: this.mapearEspecialidades(fhirPractitioner.qualification),
      registroSuperintendencia: fhirPractitioner.identifier?.find(
        (id: any) => id.system?.includes('superintendencia')
      )?.value || '',
      habilitado: fhirPractitioner.active !== false,
      lugaresAtencion: [],
      ultimaActualizacion: new Date(fhirPractitioner.meta?.lastUpdated || new Date()),
    };
  }

  private mapearEspecialidades(qualifications: any[]): Especialidad[] {
    if (!qualifications) return [];

    return qualifications
      .filter(q => q.code?.coding?.some((c: any) => c.system?.includes('especialidad')))
      .map(q => ({
        codigo: q.code?.coding?.[0]?.code || '',
        nombre: q.code?.text || q.code?.coding?.[0]?.display || '',
        certificadaCONACEM: q.issuer?.display?.includes('CONACEM') || false,
        fechaCertificacion: q.period?.start ? new Date(q.period.start) : undefined,
      }));
  }

  private mapearFHIRAEstablecimiento(fhirOrg: any): EstablecimientoSalud {
    const deisIdentifier = fhirOrg.identifier?.find(
      (id: any) => id.system?.includes('2.16.152.1.12.1')
    );

    return {
      id: fhirOrg.id,
      codigoDEIS: deisIdentifier?.value || '',
      nombre: fhirOrg.name || '',
      tipo: fhirOrg.type?.[0]?.text || '',
      dependencia: fhirOrg.type?.[0]?.coding?.some(
        (c: any) => c.code === 'publico'
      ) ? 'PUBLICO' : 'PRIVADO',
      servicioSalud: fhirOrg.partOf?.display,
      direccion: fhirOrg.address?.[0]?.line?.join(', ') || '',
      comuna: fhirOrg.address?.[0]?.city || '',
      region: fhirOrg.address?.[0]?.state || '',
      telefono: fhirOrg.telecom?.find((t: any) => t.system === 'phone')?.value,
      acreditado: fhirOrg.extension?.some(
        (e: any) => e.url?.includes('acreditacion') && e.valueBoolean
      ) || false,
    };
  }
}

export const hpdClient = new HPDClient();
