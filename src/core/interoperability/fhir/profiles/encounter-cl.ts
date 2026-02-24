/**
 * Perfil FHIR Encounter Chile (Core CL)
 *
 * Encuentro clínico según la Guía de Implementación Core CL.
 * Representa atenciones, consultas, hospitalizaciones.
 *
 * Referencia: https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/EncounterCL
 *
 * @module core/interoperability/fhir/profiles/encounter-cl
 */

import { FHIRResource } from '../fhir.client.js';

/**
 * Tipos de encuentro/atención
 */
export const TIPOS_ENCUENTRO = {
  AMBULATORIO: { code: 'AMB', display: 'Ambulatorio' },
  EMERGENCIA: { code: 'EMER', display: 'Emergencia' },
  HOSPITALIZACION: { code: 'IMP', display: 'Hospitalización' },
  DOMICILIARIO: { code: 'HH', display: 'Atención Domiciliaria' },
  VIRTUAL: { code: 'VR', display: 'Virtual/Telemedicina' },
};

/**
 * Estados del encuentro
 */
export const ESTADOS_ENCUENTRO = {
  PLANIFICADO: 'planned',
  EN_PROGRESO: 'in-progress',
  FINALIZADO: 'finished',
  CANCELADO: 'cancelled',
} as const;

/**
 * Recurso Encounter según perfil Core CL
 */
export interface EncounterCL extends FHIRResource {
  resourceType: 'Encounter';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/EncounterCL'];
  };
  /** Estado del encuentro */
  status: typeof ESTADOS_ENCUENTRO[keyof typeof ESTADOS_ENCUENTRO];
  /** Clase de encuentro */
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode';
    code: string;
    display: string;
  };
  /** Tipo de atención */
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  /** Prioridad */
  priority?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  /** Paciente */
  subject: {
    reference: string;
    display?: string;
  };
  /** Participantes (profesionales) */
  participant?: Array<{
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
      }>;
    }>;
    individual: {
      reference: string;
      display?: string;
    };
  }>;
  /** Período de la atención */
  period?: {
    start: string;
    end?: string;
  };
  /** Motivo de consulta */
  reasonCode?: Array<{
    coding?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  /** Diagnósticos asociados */
  diagnosis?: Array<{
    condition: {
      reference: string;
      display?: string;
    };
    use?: {
      coding: Array<{
        system: string;
        code: string;
      }>;
    };
  }>;
  /** Ubicación/establecimiento */
  location?: Array<{
    location: {
      reference: string;
      display?: string;
    };
    status?: 'planned' | 'active' | 'completed';
  }>;
  /** Organización responsable */
  serviceProvider?: {
    reference: string;
    display?: string;
  };
}

/**
 * Construye un recurso Encounter Chile
 */
export function buildEncounterCL(params: {
  estado: keyof typeof ESTADOS_ENCUENTRO;
  tipoEncuentro: keyof typeof TIPOS_ENCUENTRO;
  pacienteRef: string;
  pacienteNombre?: string;
  profesionalRef?: string;
  profesionalNombre?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  motivoConsulta?: string;
  codigoMotivo?: { system: string; code: string; display: string };
  organizacionRef?: string;
  organizacionNombre?: string;
  ubicacionRef?: string;
  ubicacionNombre?: string;
}): EncounterCL {
  const tipo = TIPOS_ENCUENTRO[params.tipoEncuentro];

  const encounter: EncounterCL = {
    resourceType: 'Encounter',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/EncounterCL'],
    },
    status: ESTADOS_ENCUENTRO[params.estado],
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: tipo.code,
      display: tipo.display,
    },
    subject: {
      reference: params.pacienteRef,
      display: params.pacienteNombre,
    },
    period: {
      start: params.fechaInicio.toISOString(),
      end: params.fechaFin?.toISOString(),
    },
  };

  // Participante (profesional)
  if (params.profesionalRef) {
    encounter.participant = [{
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'PPRF',
        }],
      }],
      individual: {
        reference: params.profesionalRef,
        display: params.profesionalNombre,
      },
    }];
  }

  // Motivo de consulta
  if (params.motivoConsulta || params.codigoMotivo) {
    encounter.reasonCode = [{
      coding: params.codigoMotivo ? [params.codigoMotivo] : undefined,
      text: params.motivoConsulta,
    }];
  }

  // Organización
  if (params.organizacionRef) {
    encounter.serviceProvider = {
      reference: params.organizacionRef,
      display: params.organizacionNombre,
    };
  }

  // Ubicación
  if (params.ubicacionRef) {
    encounter.location = [{
      location: {
        reference: params.ubicacionRef,
        display: params.ubicacionNombre,
      },
      status: 'active',
    }];
  }

  return encounter;
}
