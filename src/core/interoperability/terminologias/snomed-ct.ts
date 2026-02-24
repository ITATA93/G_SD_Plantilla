/**
 * Terminología SNOMED CT
 *
 * Sistema de terminología clínica estándar adoptado por Chile.
 * Chile es miembro de SNOMED International desde 2013.
 *
 * Uso principal:
 * - Codificación de diagnósticos
 * - Hallazgos clínicos
 * - Procedimientos
 *
 * @module core/interoperability/terminologias/snomed-ct
 */

/**
 * Sistema SNOMED CT
 */
export const SNOMED_CT_SYSTEM = 'http://snomed.info/sct';

/**
 * Concepto SNOMED CT
 */
export interface SNOMEDConcept {
  /** Código SNOMED CT */
  code: string;
  /** Término preferido en español */
  display: string;
  /** Término completo */
  fullySpecifiedName?: string;
  /** Jerarquía */
  hierarchy?: string;
}

/**
 * Codificación para FHIR
 */
export interface SNOMEDCoding {
  system: typeof SNOMED_CT_SYSTEM;
  code: string;
  display: string;
  version?: string;
}

/**
 * Códigos SNOMED CT comunes en atención primaria
 */
export const SNOMED_COMMON = {
  // Hallazgos vitales
  PRESION_ARTERIAL: { code: '75367002', display: 'Presión arterial' },
  FRECUENCIA_CARDIACA: { code: '364075005', display: 'Frecuencia cardíaca' },
  TEMPERATURA_CORPORAL: { code: '386725007', display: 'Temperatura corporal' },
  PESO_CORPORAL: { code: '27113001', display: 'Peso corporal' },
  TALLA: { code: '50373000', display: 'Estatura' },
  IMC: { code: '60621009', display: 'Índice de masa corporal' },
  SATURACION_O2: { code: '431314004', display: 'Saturación de oxígeno' },

  // Diagnósticos frecuentes
  DIABETES_TIPO_2: { code: '44054006', display: 'Diabetes mellitus tipo 2' },
  HIPERTENSION: { code: '38341003', display: 'Hipertensión arterial' },
  ASMA: { code: '195967001', display: 'Asma' },
  OBESIDAD: { code: '414916001', display: 'Obesidad' },
  DEPRESION: { code: '35489007', display: 'Trastorno depresivo' },
  ANSIEDAD: { code: '197480006', display: 'Trastorno de ansiedad' },
  HIPOTIROIDISMO: { code: '40930008', display: 'Hipotiroidismo' },
  DISLIPIDEMIA: { code: '370992007', display: 'Dislipidemia' },

  // COVID-19
  COVID_19: { code: '840539006', display: 'Enfermedad por coronavirus 2019' },
  SOSPECHA_COVID: { code: '840544004', display: 'Sospecha de COVID-19' },
  VACUNACION_COVID: { code: '840534001', display: 'Vacunación contra COVID-19' },

  // Procedimientos comunes
  EXAMEN_FISICO: { code: '5880005', display: 'Examen físico general' },
  ELECTROCARDIOGRAMA: { code: '29303009', display: 'Electrocardiograma' },
  RADIOGRAFIA_TORAX: { code: '399208008', display: 'Radiografía de tórax' },
  HEMOGRAMA: { code: '26604007', display: 'Hemograma completo' },
  PERFIL_BIOQUIMICO: { code: '166312007', display: 'Perfil bioquímico' },

  // Estados
  EMBARAZO: { code: '77386006', display: 'Embarazo' },
  LACTANCIA: { code: '169750002', display: 'Lactancia materna' },
  FUMADOR_ACTIVO: { code: '77176002', display: 'Fumador activo' },
  EX_FUMADOR: { code: '8517006', display: 'Ex fumador' },
  NO_FUMADOR: { code: '8392000', display: 'No fumador' },
};

/**
 * Jerarquías principales SNOMED CT
 */
export const SNOMED_HIERARCHIES = {
  HALLAZGO_CLINICO: '404684003',
  PROCEDIMIENTO: '71388002',
  ESTRUCTURA_CORPORAL: '123037004',
  ORGANISMO: '410607006',
  SUSTANCIA: '105590001',
  PRODUCTO_FARMACEUTICO: '373873005',
  CONCEPTO_CALIFICADOR: '362981000',
  EVENTO: '272379006',
  SITUACION: '243796009',
};

/**
 * Crea un Coding SNOMED CT para FHIR
 */
export function createSNOMEDCoding(concept: SNOMEDConcept): SNOMEDCoding {
  return {
    system: SNOMED_CT_SYSTEM,
    code: concept.code,
    display: concept.display,
  };
}

/**
 * Crea un CodeableConcept FHIR con SNOMED CT
 */
export function createSNOMEDCodeableConcept(
  concept: SNOMEDConcept,
  text?: string
): {
  coding: SNOMEDCoding[];
  text?: string;
} {
  return {
    coding: [createSNOMEDCoding(concept)],
    text: text || concept.display,
  };
}

/**
 * Busca un concepto SNOMED CT por código
 */
export function findSNOMEDByCode(code: string): SNOMEDConcept | undefined {
  const allConcepts = Object.values(SNOMED_COMMON);
  return allConcepts.find(c => c.code === code);
}

/**
 * Busca conceptos SNOMED CT por texto
 */
export function searchSNOMED(searchText: string): SNOMEDConcept[] {
  const normalizedSearch = searchText.toLowerCase();
  const allConcepts = Object.values(SNOMED_COMMON);

  return allConcepts.filter(c =>
    c.display.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Valida si un código SNOMED CT tiene el formato correcto
 */
export function isValidSNOMEDCode(code: string): boolean {
  // SNOMED CT usa códigos numéricos de 6-18 dígitos
  return /^\d{6,18}$/.test(code);
}
