/**
 * Core CL - Guía de Implementación FHIR Chile
 *
 * Índice de todos los perfiles Core CL v1.9.x
 * Referencia: https://hl7chile.cl/fhir/ig/clcore/
 *
 * @module core/interoperability/fhir/profiles
 */

// Exportar todos los perfiles
export * from './patient-cl.js';
export * from './practitioner-cl.js';
export * from './organization-cl.js';
export * from './location-cl.js';
export * from './encounter-cl.js';
export * from './condition-cl.js';
export * from './medication-cl.js';
export * from './immunization-cl.js';
export * from './observation-cl.js';
export * from './allergy-cl.js';

/**
 * URLs de perfiles Core CL
 */
export const CORE_CL_PROFILES = {
  Patient: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CorePacienteCl',
  Practitioner: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CorePrestadorCl',
  PractitionerRole: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreRolClinicoCl',
  Organization: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreOrganizacionCl',
  Location: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreLocalizacionCl',
  Encounter: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/EncounterCL',
  Condition: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreDiagnosticoCl',
  Medication: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreMedicamentoCl',
  Immunization: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/ImmunizationCL',
  Observation: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreObservacionCL',
  AllergyIntolerance: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CoreAlergiaIntCl',
  DocumentReference: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/DocumentoCl',
  AuditEvent: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/AuditEventCl',
  Provenance: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/ProvenanceCl',
} as const;

/**
 * Extensiones Core CL
 */
export const CORE_CL_EXTENSIONS = {
  // Paciente
  Nacionalidad: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/CodigoPaises',
  IdentidadGenero: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/IdentidadDeGenero',
  SexoBiologico: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/SexoBiologico',
  PueblosOriginarios: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/PueblosOriginarios',

  // Dirección
  CodigoComunas: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/ComunasCl',
  CodigoProvincias: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/ProvinciasCl',
  CodigoRegiones: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/RegionesCl',

  // Contacto
  IdContacto: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/IdContacto',

  // Medicamentos
  TipoIdentificadorMedicamento: 'https://hl7chile.cl/fhir/ig/clcore/StructureDefinition/TipoIdentificador',
} as const;

/**
 * CodeSystems Core CL
 */
export const CORE_CL_CODESYSTEMS = {
  Comunas: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodComunasCL',
  Provincias: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodProvinciasCL',
  Regiones: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSCodRegionCL',
  Paises: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CodPais',
  PueblosOriginarios: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSPueblosOriginarios',
  Prevision: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSPrevision',
  TiposEstablecimientos: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSTiposEstablecimientos',
  EspecialidadesDeis: 'https://hl7chile.cl/fhir/ig/clcore/CodeSystem/CSEspecialidadesDeisCL',
} as const;

/**
 * ValueSets Core CL
 */
export const CORE_CL_VALUESETS = {
  Comunas: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/VSCodigosComunaCL',
  Provincias: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/VSCodigosProvinciasCL',
  Regiones: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/VSCodigosRegionesCL',
  Paises: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/CodPais',
  Especialidades: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/VSEspecialidadesCL',
  TiposDocumentos: 'https://hl7chile.cl/fhir/ig/clcore/ValueSet/VSTiposDocumentos',
} as const;

/**
 * Versión actual de Core CL
 */
export const CORE_CL_VERSION = '1.9.3';

/**
 * URL base de la guía de implementación
 */
export const CORE_CL_IG_URL = 'https://hl7chile.cl/fhir/ig/clcore/';
