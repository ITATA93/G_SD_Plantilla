/**
 * Configuración del Kit Digital - Gobierno de Chile
 *
 * URLs y configuración para integración con el Framework Kit de Gobierno.
 *
 * Referencias:
 * - https://kitdigital.gob.cl/
 * - https://framework.digital.gob.cl/
 *
 * @module ui/kit-digital/config
 */

/**
 * URLs de recursos del Kit Digital
 */
export const KIT_DIGITAL_URLS = {
  // CDN oficial
  CDN_BASE: 'https://cdn.digital.gob.cl',

  // CSS Framework
  CSS_FRAMEWORK: 'https://cdn.digital.gob.cl/v2/framework-gobcl.min.css',
  CSS_FRAMEWORK_DEV: 'https://cdn.digital.gob.cl/v2/framework-gobcl.css',

  // JavaScript
  JS_FRAMEWORK: 'https://cdn.digital.gob.cl/v2/framework-gobcl.min.js',

  // Fuentes
  FONTS_ROBOTO: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',

  // Imágenes institucionales
  LOGO_GOBIERNO: 'https://cdn.digital.gob.cl/images/logo-gobierno.svg',
  LOGO_GOBIERNO_BLANCO: 'https://cdn.digital.gob.cl/images/logo-gobierno-blanco.svg',
  FAVICON: 'https://cdn.digital.gob.cl/images/favicon.ico',

  // Documentación
  DOC_FRAMEWORK: 'https://framework.digital.gob.cl/',
  DOC_KIT_DIGITAL: 'https://kitdigital.gob.cl/',
  DOC_GUIA_DIGITAL: 'https://www.guiadigital.gob.cl/',
  FIGMA_UI_KIT: 'https://www.figma.com/community/file/1319005921039608306',
} as const;

/**
 * Colores institucionales del Gobierno de Chile
 */
export const COLORES_GOB = {
  // Primarios
  primary: '#0F69B4',
  primaryDark: '#0A4D85',
  primaryLight: '#4A9AD4',

  // Secundarios
  secondary: '#1E3A5F',
  secondaryDark: '#142840',
  secondaryLight: '#2E5A8F',

  // Acento (Rojo Chile)
  accent: '#E6332A',
  accentDark: '#B82920',
  accentLight: '#FF5A52',

  // Estados
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',

  // Grises
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#6C757D',
  gray600: '#495057',
  gray700: '#343A40',
  gray800: '#212529',
  gray900: '#1A1A1A',

  // Fondos
  bgLight: '#FFFFFF',
  bgGray: '#F4F4F4',
  bgDark: '#1E3A5F',
} as const;

/**
 * Tipografía oficial
 */
export const TIPOGRAFIA_GOB = {
  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    bold: '700',
  },
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

/**
 * Breakpoints responsivos (Bootstrap 4)
 */
export const BREAKPOINTS = {
  xs: '0',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
} as const;

/**
 * Espaciado (sistema de 8px)
 */
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '1rem',      // 16px
  4: '1.5rem',    // 24px
  5: '3rem',      // 48px
} as const;

/**
 * Clases CSS del Framework Kit de Gobierno
 */
export const CSS_CLASSES = {
  // Contenedores
  container: 'container',
  containerFluid: 'container-fluid',

  // Botones
  btn: 'btn',
  btnPrimary: 'btn btn-primary',
  btnSecondary: 'btn btn-secondary',
  btnOutline: 'btn btn-outline-primary',
  btnDanger: 'btn btn-danger',
  btnSuccess: 'btn btn-success',
  btnLg: 'btn-lg',
  btnSm: 'btn-sm',

  // Formularios
  formGroup: 'form-group',
  formControl: 'form-control',
  formLabel: 'form-label',
  formCheck: 'form-check',
  formCheckInput: 'form-check-input',
  formCheckLabel: 'form-check-label',
  invalidFeedback: 'invalid-feedback',
  isInvalid: 'is-invalid',

  // Alertas
  alert: 'alert',
  alertSuccess: 'alert alert-success',
  alertWarning: 'alert alert-warning',
  alertDanger: 'alert alert-danger',
  alertInfo: 'alert alert-info',

  // Cards
  card: 'card',
  cardHeader: 'card-header',
  cardBody: 'card-body',
  cardFooter: 'card-footer',
  cardTitle: 'card-title',

  // Navegación
  nav: 'nav',
  navbar: 'navbar',
  navbarBrand: 'navbar-brand',
  navItem: 'nav-item',
  navLink: 'nav-link',
  breadcrumb: 'breadcrumb',
  breadcrumbItem: 'breadcrumb-item',

  // Tablas
  table: 'table',
  tableStriped: 'table table-striped',
  tableHover: 'table table-hover',
  tableResponsive: 'table-responsive',

  // Utilidades
  textCenter: 'text-center',
  textRight: 'text-right',
  textMuted: 'text-muted',
  textPrimary: 'text-primary',
  textDanger: 'text-danger',
  textSuccess: 'text-success',
  bgPrimary: 'bg-primary',
  bgLight: 'bg-light',
  bgDark: 'bg-dark',
} as const;

/**
 * Genera el HTML para incluir el Framework Kit de Gobierno
 */
export function generateKitDigitalHead(): string {
  return `
    <!-- Kit Digital - Gobierno de Chile -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${KIT_DIGITAL_URLS.FONTS_ROBOTO}" rel="stylesheet">
    <link rel="stylesheet" href="${KIT_DIGITAL_URLS.CSS_FRAMEWORK}">
    <link rel="icon" href="${KIT_DIGITAL_URLS.FAVICON}">
  `.trim();
}

/**
 * Genera el script para incluir el Framework Kit de Gobierno
 */
export function generateKitDigitalScripts(): string {
  return `
    <!-- Kit Digital - JavaScript -->
    <script src="${KIT_DIGITAL_URLS.JS_FRAMEWORK}"></script>
  `.trim();
}
