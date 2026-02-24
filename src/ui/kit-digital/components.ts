/**
 * Componentes HTML del Kit Digital
 *
 * Helpers para generar componentes HTML según el Framework Kit de Gobierno.
 * Para uso en templates server-side o generación dinámica.
 *
 * @module ui/kit-digital/components
 */

import { COLORES_GOB, CSS_CLASSES, KIT_DIGITAL_URLS } from './config.js';

/**
 * Genera el header institucional del Gobierno
 */
export function headerGobierno(params: {
  nombreInstitucion: string;
  logoInstitucion?: string;
  menuItems?: Array<{ label: string; href: string; active?: boolean }>;
}): string {
  const menuHtml = params.menuItems?.map(item => `
    <li class="nav-item">
      <a class="nav-link ${item.active ? 'active' : ''}" href="${item.href}">${item.label}</a>
    </li>
  `).join('') || '';

  return `
    <header class="header-gobierno">
      <div class="container">
        <nav class="navbar navbar-expand-lg navbar-light">
          <a class="navbar-brand" href="/">
            <img src="${KIT_DIGITAL_URLS.LOGO_GOBIERNO}" alt="Gobierno de Chile" height="40">
            ${params.logoInstitucion ? `<img src="${params.logoInstitucion}" alt="${params.nombreInstitucion}" height="40" class="ml-3">` : ''}
            <span class="ml-2">${params.nombreInstitucion}</span>
          </a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ml-auto">
              ${menuHtml}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  `.trim();
}

/**
 * Genera el footer institucional del Gobierno
 */
export function footerGobierno(params: {
  nombreInstitucion: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  redesSociales?: Array<{ red: string; url: string }>;
}): string {
  const redesHtml = params.redesSociales?.map(red => `
    <a href="${red.url}" target="_blank" rel="noopener" class="text-white mr-3">
      <i class="fab fa-${red.red}"></i>
    </a>
  `).join('') || '';

  return `
    <footer class="footer-gobierno bg-dark text-white py-4">
      <div class="container">
        <div class="row">
          <div class="col-md-4">
            <img src="${KIT_DIGITAL_URLS.LOGO_GOBIERNO_BLANCO}" alt="Gobierno de Chile" height="50">
            <p class="mt-3">${params.nombreInstitucion}</p>
          </div>
          <div class="col-md-4">
            <h5>Contacto</h5>
            ${params.direccion ? `<p><i class="fas fa-map-marker-alt"></i> ${params.direccion}</p>` : ''}
            ${params.telefono ? `<p><i class="fas fa-phone"></i> ${params.telefono}</p>` : ''}
            ${params.email ? `<p><i class="fas fa-envelope"></i> ${params.email}</p>` : ''}
          </div>
          <div class="col-md-4">
            <h5>Síguenos</h5>
            <div class="redes-sociales">
              ${redesHtml}
            </div>
          </div>
        </div>
        <hr class="bg-light">
        <div class="row">
          <div class="col-12 text-center">
            <small>© ${new Date().getFullYear()} Gobierno de Chile. Todos los derechos reservados.</small>
          </div>
        </div>
      </div>
    </footer>
  `.trim();
}

/**
 * Genera un breadcrumb de navegación
 */
export function breadcrumb(items: Array<{ label: string; href?: string }>): string {
  const itemsHtml = items.map((item, index) => {
    const isLast = index === items.length - 1;
    if (isLast) {
      return `<li class="breadcrumb-item active" aria-current="page">${item.label}</li>`;
    }
    return `<li class="breadcrumb-item"><a href="${item.href || '#'}">${item.label}</a></li>`;
  }).join('');

  return `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        ${itemsHtml}
      </ol>
    </nav>
  `.trim();
}

/**
 * Genera una alerta
 */
export function alerta(params: {
  tipo: 'success' | 'warning' | 'danger' | 'info';
  mensaje: string;
  titulo?: string;
  dismissible?: boolean;
}): string {
  const dismissBtn = params.dismissible
    ? '<button type="button" class="close" data-dismiss="alert" aria-label="Cerrar"><span aria-hidden="true">&times;</span></button>'
    : '';

  return `
    <div class="alert alert-${params.tipo} ${params.dismissible ? 'alert-dismissible fade show' : ''}" role="alert">
      ${params.titulo ? `<h4 class="alert-heading">${params.titulo}</h4>` : ''}
      ${params.mensaje}
      ${dismissBtn}
    </div>
  `.trim();
}

/**
 * Genera un card
 */
export function card(params: {
  titulo?: string;
  subtitulo?: string;
  contenido: string;
  imagen?: string;
  footer?: string;
  acciones?: Array<{ label: string; href: string; primary?: boolean }>;
}): string {
  const accionesHtml = params.acciones?.map(acc => `
    <a href="${acc.href}" class="btn ${acc.primary ? 'btn-primary' : 'btn-outline-primary'}">${acc.label}</a>
  `).join(' ') || '';

  return `
    <div class="card">
      ${params.imagen ? `<img src="${params.imagen}" class="card-img-top" alt="">` : ''}
      <div class="card-body">
        ${params.titulo ? `<h5 class="card-title">${params.titulo}</h5>` : ''}
        ${params.subtitulo ? `<h6 class="card-subtitle mb-2 text-muted">${params.subtitulo}</h6>` : ''}
        <div class="card-text">${params.contenido}</div>
        ${accionesHtml ? `<div class="mt-3">${accionesHtml}</div>` : ''}
      </div>
      ${params.footer ? `<div class="card-footer text-muted">${params.footer}</div>` : ''}
    </div>
  `.trim();
}

/**
 * Genera un campo de formulario
 */
export function campoFormulario(params: {
  tipo: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  nombre: string;
  label: string;
  placeholder?: string;
  requerido?: boolean;
  error?: string;
  valor?: string;
  opciones?: Array<{ value: string; label: string }>;
  ayuda?: string;
}): string {
  const inputId = `input-${params.nombre}`;
  const isInvalid = params.error ? 'is-invalid' : '';
  const required = params.requerido ? 'required' : '';

  let inputHtml: string;

  if (params.tipo === 'textarea') {
    inputHtml = `
      <textarea class="form-control ${isInvalid}" id="${inputId}" name="${params.nombre}"
        placeholder="${params.placeholder || ''}" ${required}>${params.valor || ''}</textarea>
    `;
  } else if (params.tipo === 'select') {
    const opcionesHtml = params.opciones?.map(opt =>
      `<option value="${opt.value}" ${params.valor === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('') || '';

    inputHtml = `
      <select class="form-control ${isInvalid}" id="${inputId}" name="${params.nombre}" ${required}>
        <option value="">${params.placeholder || 'Seleccione...'}</option>
        ${opcionesHtml}
      </select>
    `;
  } else {
    inputHtml = `
      <input type="${params.tipo}" class="form-control ${isInvalid}" id="${inputId}" name="${params.nombre}"
        placeholder="${params.placeholder || ''}" value="${params.valor || ''}" ${required}>
    `;
  }

  return `
    <div class="form-group">
      <label for="${inputId}">${params.label}${params.requerido ? ' <span class="text-danger">*</span>' : ''}</label>
      ${inputHtml}
      ${params.ayuda ? `<small class="form-text text-muted">${params.ayuda}</small>` : ''}
      ${params.error ? `<div class="invalid-feedback">${params.error}</div>` : ''}
    </div>
  `.trim();
}

/**
 * Genera un botón
 */
export function boton(params: {
  texto: string;
  tipo?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline-primary';
  tamano?: 'sm' | 'lg';
  href?: string;
  disabled?: boolean;
  icono?: string;
  submit?: boolean;
}): string {
  const clase = `btn btn-${params.tipo || 'primary'} ${params.tamano ? `btn-${params.tamano}` : ''}`;
  const disabled = params.disabled ? 'disabled' : '';
  const icono = params.icono ? `<i class="${params.icono} mr-2"></i>` : '';

  if (params.href) {
    return `<a href="${params.href}" class="${clase} ${disabled}">${icono}${params.texto}</a>`;
  }

  return `<button type="${params.submit ? 'submit' : 'button'}" class="${clase}" ${disabled}>${icono}${params.texto}</button>`;
}

/**
 * Genera una tabla responsiva
 */
export function tabla(params: {
  columnas: string[];
  filas: string[][];
  striped?: boolean;
  hover?: boolean;
}): string {
  const thHtml = params.columnas.map(col => `<th scope="col">${col}</th>`).join('');
  const tbodyHtml = params.filas.map(fila => {
    const tdHtml = fila.map(celda => `<td>${celda}</td>`).join('');
    return `<tr>${tdHtml}</tr>`;
  }).join('');

  const clases = [
    'table',
    params.striped ? 'table-striped' : '',
    params.hover ? 'table-hover' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="table-responsive">
      <table class="${clases}">
        <thead class="thead-dark">
          <tr>${thHtml}</tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>
    </div>
  `.trim();
}
