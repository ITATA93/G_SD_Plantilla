# Kit Digital - Gobierno de Chile

Integración con el Framework Kit de Gobierno para interfaces de usuario.

## Recursos Oficiales

- **Kit Digital**: https://kitdigital.gob.cl/
- **Framework CSS**: https://framework.digital.gob.cl/
- **UI Kit Figma**: https://www.figma.com/community/file/1319005921039608306
- **Guía Digital**: https://www.guiadigital.gob.cl/

## Instalación

### Opción 1: NPM (Recomendado)

```bash
npm install framework-gobcl
```

```typescript
// En tu archivo principal de estilos
import 'framework-gobcl/dist/css/framework-gobcl.min.css';
```

### Opción 2: CDN

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.digital.gob.cl/v2/framework-gobcl.min.css">

<!-- JavaScript (opcional) -->
<script src="https://cdn.digital.gob.cl/v2/framework-gobcl.min.js"></script>
```

### Opción 3: SCSS

```scss
// En tu archivo style.scss
@import 'framework-gobcl/scss/framework-gobcl';
```

## Uso con React/Vue

Ver archivos de componentes en esta carpeta para wrappers TypeScript.

## Componentes Disponibles

El framework incluye:

- **Navegación**: Header, Footer, Breadcrumbs, Menú lateral
- **Formularios**: Inputs, Selects, Checkboxes, Radios, DatePickers
- **Botones**: Primarios, Secundarios, Outline, Danger
- **Alertas**: Info, Success, Warning, Danger
- **Cards**: Cards de contenido, Cards de servicio
- **Tablas**: Tablas responsivas con paginación
- **Modales**: Diálogos de confirmación
- **Tipografía**: Estilos de texto oficiales

## Colores Institucionales

```scss
// Colores principales
$color-primary: #0F69B4;      // Azul institucional
$color-secondary: #1E3A5F;    // Azul oscuro
$color-accent: #E6332A;       // Rojo Chile

// Colores de estado
$color-success: #28A745;
$color-warning: #FFC107;
$color-danger: #DC3545;
$color-info: #17A2B8;

// Grises
$color-gray-100: #F8F9FA;
$color-gray-500: #6C757D;
$color-gray-900: #212529;
```

## Tipografía

Fuente oficial: **Roboto**

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

## Accesibilidad

El framework cumple con:
- WCAG 2.1 Nivel AA
- Navegación por teclado
- Lectores de pantalla
- Contraste de colores

## Logo Gobierno

```html
<!-- Logo oficial -->
<img src="https://cdn.digital.gob.cl/images/logo-gobierno.svg" alt="Gobierno de Chile">
```
