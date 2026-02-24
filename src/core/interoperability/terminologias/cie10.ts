/**
 * Clasificación Internacional de Enfermedades CIE-10
 *
 * Chile utiliza CIE-10 edición 2018 con actualización 2022.
 * Requerido para codificación de diagnósticos en GES, licencias médicas
 * y estadísticas de salud.
 *
 * @module core/interoperability/terminologias/cie10
 */

/**
 * Sistema CIE-10
 */
export const CIE10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';

/**
 * Sistema CIE-10 Chile (si hay extensiones locales)
 */
export const CIE10_CL_SYSTEM = 'https://hl7chile.cl/fhir/ig/CoreCL/CodeSystem/CSCIE10CL';

/**
 * Código CIE-10
 */
export interface CIE10Code {
  /** Código (ej: "E11.9") */
  code: string;
  /** Descripción */
  description: string;
  /** Capítulo */
  chapter: string;
  /** Grupo */
  group?: string;
  /** Es GES */
  isGES?: boolean;
}

/**
 * Codificación CIE-10 para FHIR
 */
export interface CIE10Coding {
  system: typeof CIE10_SYSTEM | typeof CIE10_CL_SYSTEM;
  code: string;
  display: string;
  version?: string;
}

/**
 * Capítulos CIE-10
 */
export const CIE10_CHAPTERS = {
  I: { range: 'A00-B99', name: 'Ciertas enfermedades infecciosas y parasitarias' },
  II: { range: 'C00-D48', name: 'Neoplasias' },
  III: { range: 'D50-D89', name: 'Enfermedades de la sangre' },
  IV: { range: 'E00-E90', name: 'Enfermedades endocrinas, nutricionales y metabólicas' },
  V: { range: 'F00-F99', name: 'Trastornos mentales y del comportamiento' },
  VI: { range: 'G00-G99', name: 'Enfermedades del sistema nervioso' },
  VII: { range: 'H00-H59', name: 'Enfermedades del ojo y sus anexos' },
  VIII: { range: 'H60-H95', name: 'Enfermedades del oído' },
  IX: { range: 'I00-I99', name: 'Enfermedades del sistema circulatorio' },
  X: { range: 'J00-J99', name: 'Enfermedades del sistema respiratorio' },
  XI: { range: 'K00-K93', name: 'Enfermedades del sistema digestivo' },
  XII: { range: 'L00-L99', name: 'Enfermedades de la piel' },
  XIII: { range: 'M00-M99', name: 'Enfermedades del sistema osteomuscular' },
  XIV: { range: 'N00-N99', name: 'Enfermedades del sistema genitourinario' },
  XV: { range: 'O00-O99', name: 'Embarazo, parto y puerperio' },
  XVI: { range: 'P00-P96', name: 'Ciertas afecciones originadas en el período perinatal' },
  XVII: { range: 'Q00-Q99', name: 'Malformaciones congénitas' },
  XVIII: { range: 'R00-R99', name: 'Síntomas y signos no clasificados' },
  XIX: { range: 'S00-T98', name: 'Traumatismos y envenenamientos' },
  XX: { range: 'V01-Y98', name: 'Causas externas de morbilidad y mortalidad' },
  XXI: { range: 'Z00-Z99', name: 'Factores que influyen en el estado de salud' },
  XXII: { range: 'U00-U99', name: 'Códigos para propósitos especiales' },
};

/**
 * Códigos CIE-10 comunes
 */
export const CIE10_COMMON: Record<string, CIE10Code> = {
  // Diabetes
  E10: { code: 'E10', description: 'Diabetes mellitus insulinodependiente', chapter: 'IV', isGES: true },
  E11: { code: 'E11', description: 'Diabetes mellitus no insulinodependiente', chapter: 'IV', isGES: true },
  E11_9: { code: 'E11.9', description: 'Diabetes mellitus tipo 2, sin complicaciones', chapter: 'IV', isGES: true },

  // Hipertensión
  I10: { code: 'I10', description: 'Hipertensión esencial (primaria)', chapter: 'IX', isGES: true },
  I11: { code: 'I11', description: 'Enfermedad cardíaca hipertensiva', chapter: 'IX', isGES: true },

  // Enfermedades respiratorias
  J00: { code: 'J00', description: 'Rinofaringitis aguda (resfriado común)', chapter: 'X' },
  J06_9: { code: 'J06.9', description: 'Infección aguda de las vías respiratorias superiores', chapter: 'X' },
  J18_9: { code: 'J18.9', description: 'Neumonía, organismo no especificado', chapter: 'X', isGES: true },
  J45: { code: 'J45', description: 'Asma', chapter: 'X', isGES: true },

  // Salud mental
  F32: { code: 'F32', description: 'Episodio depresivo', chapter: 'V', isGES: true },
  F33: { code: 'F33', description: 'Trastorno depresivo recurrente', chapter: 'V', isGES: true },
  F41_1: { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', chapter: 'V' },

  // Neoplasias (GES)
  C50: { code: 'C50', description: 'Tumor maligno de la mama', chapter: 'II', isGES: true },
  C61: { code: 'C61', description: 'Tumor maligno de la próstata', chapter: 'II', isGES: true },
  C34: { code: 'C34', description: 'Tumor maligno del pulmón', chapter: 'II', isGES: true },

  // COVID-19
  U07_1: { code: 'U07.1', description: 'COVID-19, virus identificado', chapter: 'XXII' },
  U07_2: { code: 'U07.2', description: 'COVID-19, virus no identificado', chapter: 'XXII' },

  // Control de salud
  Z00_0: { code: 'Z00.0', description: 'Examen médico general', chapter: 'XXI' },
  Z23: { code: 'Z23', description: 'Necesidad de inmunización', chapter: 'XXI' },
  Z34: { code: 'Z34', description: 'Supervisión de embarazo normal', chapter: 'XXI' },
};

/**
 * Códigos GES (Garantías Explícitas en Salud)
 * Problemas de salud con garantía estatal
 */
export const CIE10_GES = Object.values(CIE10_COMMON).filter(c => c.isGES);

/**
 * Crea un Coding CIE-10 para FHIR
 */
export function createCIE10Coding(code: CIE10Code): CIE10Coding {
  return {
    system: CIE10_SYSTEM,
    code: code.code,
    display: code.description,
    version: '2022',
  };
}

/**
 * Crea un CodeableConcept FHIR con CIE-10
 */
export function createCIE10CodeableConcept(
  code: CIE10Code,
  text?: string
): {
  coding: CIE10Coding[];
  text?: string;
} {
  return {
    coding: [createCIE10Coding(code)],
    text: text || code.description,
  };
}

/**
 * Busca un código CIE-10
 */
export function findCIE10ByCode(code: string): CIE10Code | undefined {
  const normalizedCode = code.replace('.', '_').toUpperCase();
  return CIE10_COMMON[normalizedCode];
}

/**
 * Busca códigos CIE-10 por texto
 */
export function searchCIE10(searchText: string): CIE10Code[] {
  const normalizedSearch = searchText.toLowerCase();
  return Object.values(CIE10_COMMON).filter(c =>
    c.description.toLowerCase().includes(normalizedSearch) ||
    c.code.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Obtiene el capítulo de un código CIE-10
 */
export function getCIE10Chapter(code: string): typeof CIE10_CHAPTERS[keyof typeof CIE10_CHAPTERS] | undefined {
  const letter = code.charAt(0).toUpperCase();

  for (const [key, chapter] of Object.entries(CIE10_CHAPTERS)) {
    const [start, end] = chapter.range.split('-');
    if (letter >= start.charAt(0) && letter <= end.charAt(0)) {
      return chapter;
    }
  }

  return undefined;
}

/**
 * Valida formato de código CIE-10
 */
export function isValidCIE10Code(code: string): boolean {
  // Formato: Letra + 2 dígitos + opcional (.dígito(s))
  return /^[A-Z]\d{2}(\.\d{1,2})?$/i.test(code);
}
