/**
 * Perfil FHIR Condition Chile (Core CL)
 *
 * Diagnóstico/Condición según la Guía de Implementación Core CL.
 * Soporta codificación SNOMED CT y CIE-10.
 *
 * Referencia: https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreDiagnosticoCl
 *
 * @module core/interoperability/fhir/profiles/condition-cl
 */

import { FHIRResource } from '../fhir.client.js';
import { SNOMED_CT_SYSTEM } from '../../terminologias/snomed-ct.js';
import { CIE10_SYSTEM } from '../../terminologias/cie10.js';

/**
 * Categorías de condición
 */
export const CATEGORIAS_CONDICION = {
  DIAGNOSTICO: {
    code: 'encounter-diagnosis',
    display: 'Diagnóstico de encuentro',
    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
  },
  PROBLEMA: {
    code: 'problem-list-item',
    display: 'Problema en lista',
    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
  },
};

/**
 * Estado clínico de la condición
 */
export const ESTADO_CLINICO = {
  ACTIVO: { code: 'active', display: 'Activo' },
  RECURRENCIA: { code: 'recurrence', display: 'Recurrencia' },
  RECAIDA: { code: 'relapse', display: 'Recaída' },
  INACTIVO: { code: 'inactive', display: 'Inactivo' },
  REMISION: { code: 'remission', display: 'Remisión' },
  RESUELTO: { code: 'resolved', display: 'Resuelto' },
} as const;

/**
 * Estado de verificación
 */
export const ESTADO_VERIFICACION = {
  NO_CONFIRMADO: { code: 'unconfirmed', display: 'No confirmado' },
  PROVISIONAL: { code: 'provisional', display: 'Provisional' },
  DIFERENCIAL: { code: 'differential', display: 'Diferencial' },
  CONFIRMADO: { code: 'confirmed', display: 'Confirmado' },
  REFUTADO: { code: 'refuted', display: 'Refutado' },
  INGRESADO_ERROR: { code: 'entered-in-error', display: 'Ingresado por error' },
} as const;

/**
 * Recurso Condition según perfil Core CL
 */
export interface ConditionCL extends FHIRResource {
  resourceType: 'Condition';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreDiagnosticoCl'];
  };
  /** Estado clínico */
  clinicalStatus?: {
    coding: Array<{
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical';
      code: string;
      display: string;
    }>;
  };
  /** Estado de verificación */
  verificationStatus?: {
    coding: Array<{
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status';
      code: string;
      display: string;
    }>;
  };
  /** Categoría */
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  /** Severidad */
  severity?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  /** Código del diagnóstico (SNOMED CT o CIE-10) */
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  /** Sitio corporal */
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  /** Paciente */
  subject: {
    reference: string;
    display?: string;
  };
  /** Encuentro asociado */
  encounter?: {
    reference: string;
  };
  /** Fecha de inicio */
  onsetDateTime?: string;
  /** Fecha de resolución */
  abatementDateTime?: string;
  /** Fecha de registro */
  recordedDate?: string;
  /** Profesional que registra */
  recorder?: {
    reference: string;
    display?: string;
  };
  /** Profesional que diagnostica */
  asserter?: {
    reference: string;
    display?: string;
  };
  /** Notas */
  note?: Array<{
    text: string;
    time?: string;
    authorReference?: {
      reference: string;
    };
  }>;
}

/**
 * Construye un recurso Condition Chile con SNOMED CT
 */
export function buildConditionCLSnomed(params: {
  pacienteRef: string;
  pacienteNombre?: string;
  codigoSnomed: string;
  displaySnomed: string;
  textoLibre?: string;
  estadoClinico: keyof typeof ESTADO_CLINICO;
  estadoVerificacion: keyof typeof ESTADO_VERIFICACION;
  categoria?: keyof typeof CATEGORIAS_CONDICION;
  fechaInicio?: Date;
  fechaResolucion?: Date;
  encuentroRef?: string;
  profesionalRef?: string;
  profesionalNombre?: string;
  nota?: string;
}): ConditionCL {
  const condition: ConditionCL = {
    resourceType: 'Condition',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreDiagnosticoCl'],
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: ESTADO_CLINICO[params.estadoClinico].code,
        display: ESTADO_CLINICO[params.estadoClinico].display,
      }],
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: ESTADO_VERIFICACION[params.estadoVerificacion].code,
        display: ESTADO_VERIFICACION[params.estadoVerificacion].display,
      }],
    },
    code: {
      coding: [{
        system: SNOMED_CT_SYSTEM,
        code: params.codigoSnomed,
        display: params.displaySnomed,
      }],
      text: params.textoLibre || params.displaySnomed,
    },
    subject: {
      reference: params.pacienteRef,
      display: params.pacienteNombre,
    },
    recordedDate: new Date().toISOString(),
  };

  if (params.categoria) {
    const cat = CATEGORIAS_CONDICION[params.categoria];
    condition.category = [{
      coding: [{
        system: cat.system,
        code: cat.code,
        display: cat.display,
      }],
    }];
  }

  if (params.fechaInicio) {
    condition.onsetDateTime = params.fechaInicio.toISOString();
  }

  if (params.fechaResolucion) {
    condition.abatementDateTime = params.fechaResolucion.toISOString();
  }

  if (params.encuentroRef) {
    condition.encounter = { reference: params.encuentroRef };
  }

  if (params.profesionalRef) {
    condition.asserter = {
      reference: params.profesionalRef,
      display: params.profesionalNombre,
    };
    condition.recorder = {
      reference: params.profesionalRef,
      display: params.profesionalNombre,
    };
  }

  if (params.nota) {
    condition.note = [{
      text: params.nota,
      time: new Date().toISOString(),
    }];
  }

  return condition;
}

/**
 * Construye un recurso Condition Chile con CIE-10
 */
export function buildConditionCLCie10(params: {
  pacienteRef: string;
  pacienteNombre?: string;
  codigoCie10: string;
  displayCie10: string;
  textoLibre?: string;
  estadoClinico: keyof typeof ESTADO_CLINICO;
  estadoVerificacion: keyof typeof ESTADO_VERIFICACION;
  categoria?: keyof typeof CATEGORIAS_CONDICION;
  fechaInicio?: Date;
  encuentroRef?: string;
  profesionalRef?: string;
}): ConditionCL {
  const condition: ConditionCL = {
    resourceType: 'Condition',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreDiagnosticoCl'],
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: ESTADO_CLINICO[params.estadoClinico].code,
        display: ESTADO_CLINICO[params.estadoClinico].display,
      }],
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: ESTADO_VERIFICACION[params.estadoVerificacion].code,
        display: ESTADO_VERIFICACION[params.estadoVerificacion].display,
      }],
    },
    code: {
      coding: [{
        system: CIE10_SYSTEM,
        code: params.codigoCie10,
        display: params.displayCie10,
      }],
      text: params.textoLibre || params.displayCie10,
    },
    subject: {
      reference: params.pacienteRef,
      display: params.pacienteNombre,
    },
    recordedDate: new Date().toISOString(),
  };

  if (params.categoria) {
    const cat = CATEGORIAS_CONDICION[params.categoria];
    condition.category = [{
      coding: [{
        system: cat.system,
        code: cat.code,
        display: cat.display,
      }],
    }];
  }

  if (params.fechaInicio) {
    condition.onsetDateTime = params.fechaInicio.toISOString();
  }

  if (params.encuentroRef) {
    condition.encounter = { reference: params.encuentroRef };
  }

  if (params.profesionalRef) {
    condition.asserter = { reference: params.profesionalRef };
    condition.recorder = { reference: params.profesionalRef };
  }

  return condition;
}
