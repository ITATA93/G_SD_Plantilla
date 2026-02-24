/**
 * Perfil FHIR Patient Chile (Core CL)
 *
 * Implementación del recurso Patient según la Guía de Implementación
 * Core CL de HL7 Chile.
 *
 * Extensiones chilenas incluidas:
 * - Identificador RUN
 * - Previsión de salud
 * - Pueblo originario
 * - Nacionalidad
 *
 * Referencia: https://hl7chile.cl/
 *
 * @module core/interoperability/fhir/profiles/patient-cl
 */

import { FHIRResource } from '../fhir.client.js';

/**
 * Sistema de identificadores chilenos
 */
export const IDENTIFICADORES_CL = {
  /** OID para RUN chileno */
  RUN: 'urn:oid:2.16.152.1.2.1.1',
  /** OID para Pasaporte */
  PASAPORTE: 'http://hl7.org/fhir/sid/passport-CHL',
  /** OID para DNI extranjero */
  DNI_EXTRANJERO: 'urn:oid:2.16.152.1.2.1.2',
};

/**
 * Sistemas de previsión de salud
 */
export const PREVISION_SALUD = {
  FONASA_A: { code: 'FONASA_A', display: 'FONASA Tramo A' },
  FONASA_B: { code: 'FONASA_B', display: 'FONASA Tramo B' },
  FONASA_C: { code: 'FONASA_C', display: 'FONASA Tramo C' },
  FONASA_D: { code: 'FONASA_D', display: 'FONASA Tramo D' },
  ISAPRE: { code: 'ISAPRE', display: 'ISAPRE' },
  CAPREDENA: { code: 'CAPREDENA', display: 'CAPREDENA' },
  DIPRECA: { code: 'DIPRECA', display: 'DIPRECA' },
  PARTICULAR: { code: 'PARTICULAR', display: 'Particular' },
};

/**
 * Pueblos originarios de Chile
 */
export const PUEBLOS_ORIGINARIOS = {
  MAPUCHE: { code: 'mapuche', display: 'Mapuche' },
  AYMARA: { code: 'aymara', display: 'Aymara' },
  RAPA_NUI: { code: 'rapa-nui', display: 'Rapa Nui' },
  ATACAMENO: { code: 'atacameno', display: 'Atacameño' },
  QUECHUA: { code: 'quechua', display: 'Quechua' },
  COLLA: { code: 'colla', display: 'Colla' },
  DIAGUITA: { code: 'diaguita', display: 'Diaguita' },
  KAWESQAR: { code: 'kawesqar', display: 'Kawésqar' },
  YAGAN: { code: 'yagan', display: 'Yagán' },
  CHANGO: { code: 'chango', display: 'Chango' },
};

/**
 * Extensiones del perfil Patient Chile
 */
export interface PatientCLExtensions {
  /** Previsión de salud */
  prevision?: {
    url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/Prevision';
    valueCoding: {
      system: 'https://hl7chile.cl/fhir/ig/CoreCL/CodeSystem/CSPrevision';
      code: string;
      display: string;
    };
  };
  /** Pueblo originario */
  puebloOriginario?: {
    url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/PuebloOriginario';
    valueCoding: {
      system: 'https://hl7chile.cl/fhir/ig/CoreCL/CodeSystem/CSPueblosOriginarios';
      code: string;
      display: string;
    };
  };
  /** Nacionalidad */
  nacionalidad?: {
    url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/Nacionalidad';
    valueCoding: {
      system: 'urn:iso:std:iso:3166';
      code: string;
      display: string;
    };
  };
}

/**
 * Recurso Patient según perfil Core CL
 */
export interface PatientCL extends FHIRResource {
  resourceType: 'Patient';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/CorePacienteCl'];
    versionId?: string;
    lastUpdated?: string;
  };
  /** Identificadores (RUN obligatorio para chilenos) */
  identifier: Array<{
    use?: 'official' | 'temp' | 'secondary';
    system: string;
    value: string;
    type?: {
      coding: Array<{
        system: string;
        code: string;
      }>;
    };
  }>;
  /** Estado activo */
  active?: boolean;
  /** Nombres */
  name: Array<{
    use: 'official' | 'nickname' | 'maiden';
    family: string;
    given: string[];
    prefix?: string[];
  }>;
  /** Contacto */
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'home' | 'work' | 'mobile';
  }>;
  /** Género administrativo */
  gender: 'male' | 'female' | 'other' | 'unknown';
  /** Fecha de nacimiento */
  birthDate: string;
  /** Indicador de fallecimiento */
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  /** Dirección */
  address?: Array<{
    use?: 'home' | 'work' | 'temp';
    line: string[];
    city: string;
    district?: string;
    state: string;
    postalCode?: string;
    country: string;
    extension?: Array<{
      url: string;
      valueCodeableConcept?: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
      };
    }>;
  }>;
  /** Estado civil */
  maritalStatus?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  /** Contacto de emergencia */
  contact?: Array<{
    relationship: Array<{
      coding: Array<{
        system: string;
        code: string;
      }>;
    }>;
    name: {
      family: string;
      given: string[];
    };
    telecom?: Array<{
      system: string;
      value: string;
    }>;
  }>;
  /** Extensiones chilenas */
  extension?: Array<PatientCLExtensions[keyof PatientCLExtensions]>;
}

/**
 * Construye un recurso Patient Chile válido
 */
export function buildPatientCL(params: {
  run: string;
  nombres: string[];
  apellidoPaterno: string;
  apellidoMaterno?: string;
  fechaNacimiento: Date;
  genero: 'masculino' | 'femenino' | 'otro' | 'desconocido';
  email?: string;
  telefono?: string;
  direccion?: {
    calle: string;
    numero?: string;
    comuna: string;
    region: string;
  };
  prevision?: keyof typeof PREVISION_SALUD;
  puebloOriginario?: keyof typeof PUEBLOS_ORIGINARIOS;
  nacionalidad?: string;
}): PatientCL {
  const extensions: PatientCL['extension'] = [];

  // Agregar extensión de previsión
  if (params.prevision && PREVISION_SALUD[params.prevision]) {
    extensions.push({
      url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/Prevision',
      valueCoding: {
        system: 'https://hl7chile.cl/fhir/ig/CoreCL/CodeSystem/CSPrevision',
        code: PREVISION_SALUD[params.prevision].code,
        display: PREVISION_SALUD[params.prevision].display,
      },
    });
  }

  // Agregar extensión de pueblo originario
  if (params.puebloOriginario && PUEBLOS_ORIGINARIOS[params.puebloOriginario]) {
    extensions.push({
      url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/PuebloOriginario',
      valueCoding: {
        system: 'https://hl7chile.cl/fhir/ig/CoreCL/CodeSystem/CSPueblosOriginarios',
        code: PUEBLOS_ORIGINARIOS[params.puebloOriginario].code,
        display: PUEBLOS_ORIGINARIOS[params.puebloOriginario].display,
      },
    });
  }

  // Agregar extensión de nacionalidad
  if (params.nacionalidad) {
    extensions.push({
      url: 'https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/Nacionalidad',
      valueCoding: {
        system: 'urn:iso:std:iso:3166',
        code: params.nacionalidad,
        display: params.nacionalidad === 'CL' ? 'Chile' : params.nacionalidad,
      },
    });
  }

  const patient: PatientCL = {
    resourceType: 'Patient',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/CorePacienteCl'],
    },
    identifier: [
      {
        use: 'official',
        system: IDENTIFICADORES_CL.RUN,
        value: params.run,
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'NNCHL',
            },
          ],
        },
      },
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: params.apellidoMaterno
          ? `${params.apellidoPaterno} ${params.apellidoMaterno}`
          : params.apellidoPaterno,
        given: params.nombres,
      },
    ],
    gender: params.genero === 'masculino' ? 'male' :
            params.genero === 'femenino' ? 'female' :
            params.genero === 'otro' ? 'other' : 'unknown',
    birthDate: params.fechaNacimiento.toISOString().split('T')[0],
  };

  // Agregar telecom
  const telecom: PatientCL['telecom'] = [];
  if (params.email) {
    telecom.push({ system: 'email', value: params.email, use: 'home' });
  }
  if (params.telefono) {
    telecom.push({ system: 'phone', value: params.telefono, use: 'mobile' });
  }
  if (telecom.length > 0) {
    patient.telecom = telecom;
  }

  // Agregar dirección
  if (params.direccion) {
    patient.address = [
      {
        use: 'home',
        line: params.direccion.numero
          ? [`${params.direccion.calle} ${params.direccion.numero}`]
          : [params.direccion.calle],
        city: params.direccion.comuna,
        state: params.direccion.region,
        country: 'Chile',
      },
    ];
  }

  // Agregar extensiones
  if (extensions.length > 0) {
    patient.extension = extensions;
  }

  return patient;
}

/**
 * Valida un recurso Patient Chile
 */
export function validatePatientCL(patient: PatientCL): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Verificar perfil
  if (!patient.meta?.profile?.includes('https://hl7chile.cl/fhir/ig/CoreCL/StructureDefinition/CorePacienteCl')) {
    errors.push('Falta el perfil Core CL en meta.profile');
  }

  // Verificar identificador RUN
  const hasRun = patient.identifier?.some(id => id.system === IDENTIFICADORES_CL.RUN);
  if (!hasRun) {
    errors.push('Se requiere identificador RUN para pacientes chilenos');
  }

  // Verificar nombre
  if (!patient.name || patient.name.length === 0) {
    errors.push('Se requiere al menos un nombre');
  }

  // Verificar fecha de nacimiento
  if (!patient.birthDate) {
    errors.push('Se requiere fecha de nacimiento');
  }

  // Verificar género
  if (!patient.gender) {
    errors.push('Se requiere género');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
