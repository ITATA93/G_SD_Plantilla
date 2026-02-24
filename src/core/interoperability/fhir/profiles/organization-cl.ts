/**
 * Perfil FHIR Organization Chile (Core CL)
 *
 * Organización de salud según la Guía de Implementación Core CL.
 * Incluye extensiones para código DEIS, tipo de establecimiento.
 *
 * Referencia: https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreOrganizacionCl
 *
 * @module core/interoperability/fhir/profiles/organization-cl
 */

import { FHIRResource } from '../fhir.client.js';

/**
 * Sistema para código DEIS
 */
export const CODIGO_DEIS_SYSTEM = 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodigoDEIS';

/**
 * Tipos de establecimientos de salud
 */
export const TIPOS_ESTABLECIMIENTOS = {
  HOSPITAL: { code: '1', display: 'Hospital' },
  CLINICA: { code: '2', display: 'Clínica' },
  CONSULTORIO: { code: '3', display: 'Consultorio General' },
  CESFAM: { code: '4', display: 'Centro de Salud Familiar' },
  CECOSF: { code: '5', display: 'Centro Comunitario de Salud Familiar' },
  POSTAS: { code: '6', display: 'Posta de Salud Rural' },
  SAPU: { code: '7', display: 'Servicio de Atención Primaria de Urgencia' },
  SAR: { code: '8', display: 'Servicio de Alta Resolutividad' },
  LABORATORIO: { code: '9', display: 'Laboratorio Clínico' },
  CENTRO_DIALISIS: { code: '10', display: 'Centro de Diálisis' },
  FARMACIA: { code: '11', display: 'Farmacia' },
  CENTRO_IMAGENOLOGIA: { code: '12', display: 'Centro de Imagenología' },
  CENTRO_REHABILITACION: { code: '13', display: 'Centro de Rehabilitación' },
};

/**
 * Servicios de Salud de Chile
 */
export const SERVICIOS_SALUD = {
  SS_ARICA: { code: '1', display: 'Servicio de Salud Arica' },
  SS_IQUIQUE: { code: '2', display: 'Servicio de Salud Iquique' },
  SS_ANTOFAGASTA: { code: '3', display: 'Servicio de Salud Antofagasta' },
  SS_ATACAMA: { code: '4', display: 'Servicio de Salud Atacama' },
  SS_COQUIMBO: { code: '5', display: 'Servicio de Salud Coquimbo' },
  SS_VALPARAISO: { code: '6', display: 'Servicio de Salud Valparaíso San Antonio' },
  SS_VINA: { code: '7', display: 'Servicio de Salud Viña del Mar Quillota' },
  SS_ACONCAGUA: { code: '8', display: 'Servicio de Salud Aconcagua' },
  SS_METROPOLITANO_NORTE: { code: '9', display: 'Servicio de Salud Metropolitano Norte' },
  SS_METROPOLITANO_OCCIDENTE: { code: '10', display: 'Servicio de Salud Metropolitano Occidente' },
  SS_METROPOLITANO_CENTRAL: { code: '11', display: 'Servicio de Salud Metropolitano Central' },
  SS_METROPOLITANO_ORIENTE: { code: '12', display: 'Servicio de Salud Metropolitano Oriente' },
  SS_METROPOLITANO_SUR: { code: '13', display: 'Servicio de Salud Metropolitano Sur' },
  SS_METROPOLITANO_SUR_ORIENTE: { code: '14', display: 'Servicio de Salud Metropolitano Sur Oriente' },
  SS_OHIGGINS: { code: '15', display: 'Servicio de Salud O\'Higgins' },
  SS_MAULE: { code: '16', display: 'Servicio de Salud del Maule' },
  SS_NUBLE: { code: '17', display: 'Servicio de Salud Ñuble' },
  SS_CONCEPCION: { code: '18', display: 'Servicio de Salud Concepción' },
  SS_TALCAHUANO: { code: '19', display: 'Servicio de Salud Talcahuano' },
  SS_BIOBIO: { code: '20', display: 'Servicio de Salud Biobío' },
  SS_ARAUCANIA_NORTE: { code: '21', display: 'Servicio de Salud Araucanía Norte' },
  SS_ARAUCANIA_SUR: { code: '22', display: 'Servicio de Salud Araucanía Sur' },
  SS_VALDIVIA: { code: '23', display: 'Servicio de Salud Valdivia' },
  SS_OSORNO: { code: '24', display: 'Servicio de Salud Osorno' },
  SS_RELONCAVI: { code: '25', display: 'Servicio de Salud del Reloncaví' },
  SS_CHILOE: { code: '26', display: 'Servicio de Salud Chiloé' },
  SS_AYSEN: { code: '27', display: 'Servicio de Salud Aysén' },
  SS_MAGALLANES: { code: '28', display: 'Servicio de Salud Magallanes' },
  SS_ARAUCO: { code: '29', display: 'Servicio de Salud Arauco' },
};

/**
 * Recurso Organization según perfil Core CL
 */
export interface OrganizationCL extends FHIRResource {
  resourceType: 'Organization';
  id?: string;
  meta?: {
    profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreOrganizacionCl'];
  };
  /** Identificadores (RUT, código DEIS) */
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  /** Estado activo */
  active?: boolean;
  /** Tipo de organización */
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  /** Nombre de la organización */
  name: string;
  /** Alias/nombre corto */
  alias?: string[];
  /** Contacto */
  telecom?: Array<{
    system: 'phone' | 'email' | 'url';
    value: string;
    use?: 'work';
  }>;
  /** Dirección */
  address?: Array<{
    use?: 'work';
    line: string[];
    city: string;
    state: string;
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
  /** Organización padre (ej: Servicio de Salud) */
  partOf?: {
    reference: string;
    display?: string;
  };
}

/**
 * Construye un recurso Organization Chile
 */
export function buildOrganizationCL(params: {
  rut?: string;
  codigoDEIS?: string;
  nombre: string;
  alias?: string;
  tipoEstablecimiento: keyof typeof TIPOS_ESTABLECIMIENTOS;
  servicioSalud?: keyof typeof SERVICIOS_SALUD;
  direccion?: {
    calle: string;
    numero?: string;
    comuna: string;
    region: string;
  };
  telefono?: string;
  email?: string;
  sitioWeb?: string;
}): OrganizationCL {
  const identifiers: OrganizationCL['identifier'] = [];

  if (params.rut) {
    identifiers.push({
      system: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSIdentificadorOrganizacion',
      value: params.rut,
    });
  }

  if (params.codigoDEIS) {
    identifiers.push({
      system: CODIGO_DEIS_SYSTEM,
      value: params.codigoDEIS,
    });
  }

  const tipo = TIPOS_ESTABLECIMIENTOS[params.tipoEstablecimiento];

  const organization: OrganizationCL = {
    resourceType: 'Organization',
    meta: {
      profile: ['https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreOrganizacionCl'],
    },
    identifier: identifiers.length > 0 ? identifiers : undefined,
    active: true,
    type: [{
      coding: [{
        system: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSTiposEstablecimientos',
        code: tipo.code,
        display: tipo.display,
      }],
    }],
    name: params.nombre,
    alias: params.alias ? [params.alias] : undefined,
  };

  // Contacto
  const telecom: OrganizationCL['telecom'] = [];
  if (params.telefono) {
    telecom.push({ system: 'phone', value: params.telefono, use: 'work' });
  }
  if (params.email) {
    telecom.push({ system: 'email', value: params.email, use: 'work' });
  }
  if (params.sitioWeb) {
    telecom.push({ system: 'url', value: params.sitioWeb, use: 'work' });
  }
  if (telecom.length > 0) {
    organization.telecom = telecom;
  }

  // Dirección
  if (params.direccion) {
    organization.address = [{
      use: 'work',
      line: params.direccion.numero
        ? [`${params.direccion.calle} ${params.direccion.numero}`]
        : [params.direccion.calle],
      city: params.direccion.comuna,
      state: params.direccion.region,
      country: 'Chile',
    }];
  }

  // Servicio de Salud padre
  if (params.servicioSalud) {
    const ss = SERVICIOS_SALUD[params.servicioSalud];
    organization.partOf = {
      reference: `Organization/${ss.code}`,
      display: ss.display,
    };
  }

  return organization;
}
