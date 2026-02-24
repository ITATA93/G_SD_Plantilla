/**
 * Perfil FHIR Practitioner Chile (Core CL)
 *
 * Profesional de la salud según la Guía de Implementación Core CL.
 * Incluye extensiones para RUN, registro Superintendencia, especialidades.
 *
 * Referencia: https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CorePrestadorCl
 *
 * @module core/interoperability/fhir/profiles/practitioner-cl
 */

import { FHIRResource } from '../fhir.client.js';
import { IDENTIFICADORES_CL } from './patient-cl.js';

/**
 * Sistema para registro Superintendencia de Salud
 */
export const REGISTRO_SUPERINTENDENCIA = 'https://sis.superdesalud.gob.cl/';

/**
 * Especialidades médicas DEIS
 */
export const ESPECIALIDADES_DEIS = {
  MEDICINA_GENERAL: { code: '1', display: 'Medicina General' },
  MEDICINA_INTERNA: { code: '2', display: 'Medicina Interna' },
  PEDIATRIA: { code: '3', display: 'Pediatría' },
  CIRUGIA_GENERAL: { code: '4', display: 'Cirugía General' },
  GINECOLOGIA: { code: '5', display: 'Obstetricia y Ginecología' },
  PSIQUIATRIA: { code: '6', display: 'Psiquiatría Adultos' },
  NEUROLOGIA: { code: '7', display: 'Neurología Adultos' },
  CARDIOLOGIA: { code: '8', display: 'Cardiología Adultos' },
  DERMATOLOGIA: { code: '9', display: 'Dermatología' },
  OFTALMOLOGIA: { code: '10', display: 'Oftalmología' },
  OTORRINOLARINGOLOGIA: { code: '11', display: 'Otorrinolaringología' },
  TRAUMATOLOGIA: { code: '12', display: 'Traumatología y Ortopedia' },
  UROLOGIA: { code: '13', display: 'Urología' },
  ANESTESIOLOGIA: { code: '14', display: 'Anestesiología' },
  RADIOLOGIA: { code: '15', display: 'Radiología' },
  MEDICINA_FAMILIAR: { code: '66', display: 'Medicina Familiar' },
};

/**
 * Títulos profesionales de salud
 */
export const TITULOS_PROFESIONALES = {
  MEDICO_CIRUJANO: { code: 'MC', display: 'Médico Cirujano' },
  ENFERMERA: { code: 'ENF', display: 'Enfermera/o' },
  MATRONA: { code: 'MAT', display: 'Matrón/Matrona' },
  KINESIOLOGO: { code: 'KIN', display: 'Kinesiólogo/a' },
  NUTRICIONISTA: { code: 'NUT', display: 'Nutricionista' },
  FONOAUDIOLOGO: { code: 'FON', display: 'Fonoaudiólogo/a' },
  TECNOLOGO_MEDICO: { code: 'TM', display: 'Tecnólogo Médico' },
  TERAPEUTA_OCUPACIONAL: { code: 'TO', display: 'Terapeuta Ocupacional' },
  PSICOLOGO: { code: 'PSI', display: 'Psicólogo/a' },
  QUIMICO_FARMACEUTICO: { code: 'QF', display: 'Químico Farmacéutico' },
  ODONTOLOGO: { code: 'ODO', display: 'Odontólogo/a' },
  TENS: { code: 'TENS', display: 'Técnico en Enfermería' },
};

/**
 * Recurso Practitioner según perfil Core CL
 */
export interface PractitionerCL extends FHIRResource {
  resourceType: 'Practitioner';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CorePrestadorCl'];
  };
  /** Identificadores (RUN, Registro Superintendencia) */
  identifier: Array<{
    use?: 'official' | 'temp';
    system: string;
    value: string;
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
  }>;
  /** Estado activo */
  active?: boolean;
  /** Nombres */
  name: Array<{
    use: 'official' | 'nickname';
    family: string;
    given: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  /** Contacto */
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'work' | 'mobile';
  }>;
  /** Género */
  gender?: 'male' | 'female' | 'other' | 'unknown';
  /** Fecha de nacimiento */
  birthDate?: string;
  /** Cualificaciones (títulos, especialidades) */
  qualification?: Array<{
    identifier?: Array<{
      system: string;
      value: string;
    }>;
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
    issuer?: {
      display: string;
    };
  }>;
}

/**
 * Rol clínico del profesional
 */
export interface PractitionerRoleCL extends FHIRResource {
  resourceType: 'PractitionerRole';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreRolClinicoCl'];
  };
  /** Estado activo */
  active?: boolean;
  /** Período de vigencia */
  period?: {
    start?: string;
    end?: string;
  };
  /** Referencia al profesional */
  practitioner: {
    reference: string;
    display?: string;
  };
  /** Organización donde trabaja */
  organization?: {
    reference: string;
    display?: string;
  };
  /** Especialidad */
  specialty?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  /** Ubicaciones donde atiende */
  location?: Array<{
    reference: string;
    display?: string;
  }>;
  /** Contacto laboral */
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
    use: 'work';
  }>;
}

/**
 * Construye un recurso Practitioner Chile
 */
export function buildPractitionerCL(params: {
  run: string;
  registroSuperintendencia?: string;
  nombres: string[];
  apellidoPaterno: string;
  apellidoMaterno?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  fechaNacimiento?: Date;
  tituloProfesional: keyof typeof TITULOS_PROFESIONALES;
  universidad?: string;
  especialidades?: Array<keyof typeof ESPECIALIDADES_DEIS>;
  email?: string;
  telefono?: string;
}): PractitionerCL {
  const identifiers: PractitionerCL['identifier'] = [
    {
      use: 'official',
      system: IDENTIFICADORES_CL.RUN,
      value: params.run,
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'NNCHL',
          display: 'RUN',
        }],
      },
    },
  ];

  if (params.registroSuperintendencia) {
    identifiers.push({
      use: 'official',
      system: REGISTRO_SUPERINTENDENCIA,
      value: params.registroSuperintendencia,
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'LN',
          display: 'Registro Superintendencia',
        }],
      },
    });
  }

  const qualifications: PractitionerCL['qualification'] = [];

  // Título profesional
  const titulo = TITULOS_PROFESIONALES[params.tituloProfesional];
  qualifications.push({
    code: {
      coding: [{
        system: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSTituloProfesional',
        code: titulo.code,
        display: titulo.display,
      }],
      text: titulo.display,
    },
    issuer: params.universidad ? { display: params.universidad } : undefined,
  });

  // Especialidades
  if (params.especialidades) {
    for (const esp of params.especialidades) {
      const especialidad = ESPECIALIDADES_DEIS[esp];
      qualifications.push({
        code: {
          coding: [{
            system: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSEspecialidadesDeisCL',
            code: especialidad.code,
            display: especialidad.display,
          }],
          text: especialidad.display,
        },
      });
    }
  }

  const practitioner: PractitionerCL = {
    resourceType: 'Practitioner',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CorePrestadorCl'],
    },
    identifier: identifiers,
    active: true,
    name: [{
      use: 'official',
      family: params.apellidoMaterno
        ? `${params.apellidoPaterno} ${params.apellidoMaterno}`
        : params.apellidoPaterno,
      given: params.nombres,
    }],
    qualification: qualifications,
  };

  if (params.genero) {
    practitioner.gender = params.genero === 'masculino' ? 'male' :
                          params.genero === 'femenino' ? 'female' : 'other';
  }

  if (params.fechaNacimiento) {
    practitioner.birthDate = params.fechaNacimiento.toISOString().split('T')[0];
  }

  const telecom: PractitionerCL['telecom'] = [];
  if (params.email) {
    telecom.push({ system: 'email', value: params.email, use: 'work' });
  }
  if (params.telefono) {
    telecom.push({ system: 'phone', value: params.telefono, use: 'mobile' });
  }
  if (telecom.length > 0) {
    practitioner.telecom = telecom;
  }

  return practitioner;
}
