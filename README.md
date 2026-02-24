# Plantilla de Aplicaciones Modulares - Gobierno Digital y Salud Chile

Plantilla completa para el desarrollo de aplicaciones CRUD modulares que cumplen con las normativas chilenas de Gobierno Digital, Salud Digital y Ciberseguridad.

## Normativas Cumplidas

### Gobierno Digital
| Normativa | Descripción | Módulo |
|-----------|-------------|--------|
| **Ley 21.180** | Transformación Digital del Estado | Expediente electrónico, Auditoría |
| **Ley 21.658** | Secretaría de Gobierno Digital | ClaveÚnica, PISEE |
| **Ley 19.799** | Firma Electrónica | FEA Service |
| **Ley 19.628** | Protección de Datos Personales | Protección Datos |
| **Decreto N°11** | Norma técnica de plataformas | Health checks, Seguridad |

### Ciberseguridad
| Normativa | Descripción | Módulo |
|-----------|-------------|--------|
| **Ley 21.663** | Marco de Ciberseguridad (2025) | Security, Encryption |
| **ISO 27001** | SGSI | Rate limiting, Headers |
| **OWASP Top 10** | Seguridad web | Validación, Sanitización |

### Salud Digital
| Normativa | Descripción | Módulo |
|-----------|-------------|--------|
| **Ley 21.668** | Interoperabilidad Fichas Clínicas | FHIR R4, NID |
| **Ley 21.541** | Telemedicina | Consentimiento, Trazabilidad |
| **HL7 FHIR R4** | Estándar interoperabilidad | FHIR Client, Patient CL |
| **NT 237** | Telemedicina | Auditoría |
| **Decreto N°6** | Seguridad en Salud | Encriptación, CIA |

## Estructura del Proyecto

```
plantilla-app-chile/
├── src/
│   ├── index.ts                          # Punto de entrada
│   ├── config/
│   │   └── environment.ts                # Configuración validada
│   │
│   ├── core/                             # MÓDULOS CORE
│   │   ├── auth/                         # Autenticación
│   │   │   ├── services/
│   │   │   │   ├── claveunica.service.ts # ClaveÚnica OpenID Connect
│   │   │   │   └── session.service.ts    # Sesiones Redis
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts    # Protección de rutas
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.ts
│   │   │   └── types/
│   │   │       └── claveunica.types.ts   # Tipos ClaveÚnica
│   │   │
│   │   ├── security/                     # Seguridad Ley 21.663
│   │   │   ├── middleware/
│   │   │   │   ├── rate-limiter.ts       # Protección DDoS
│   │   │   │   └── error-handler.ts      # Manejo seguro errores
│   │   │   └── utils/
│   │   │       └── encryption.ts         # AES-256-GCM
│   │   │
│   │   ├── audit/                        # Auditoría Ley 21.180
│   │   │   ├── services/
│   │   │   │   └── audit.service.ts      # Registro eventos
│   │   │   └── middleware/
│   │   │       └── audit.middleware.ts   # Trazabilidad requests
│   │   │
│   │   ├── firma-electronica/            # FEA Ley 19.799
│   │   │   └── fea.service.ts            # Firma simple y avanzada
│   │   │
│   │   ├── expediente-electronico/       # Ley 21.180
│   │   │   └── expediente.service.ts     # Expediente con índice
│   │   │
│   │   ├── proteccion-datos/             # Ley 19.628
│   │   │   └── datos-personales.service.ts # ARCO, Consentimiento
│   │   │
│   │   └── interoperability/             # Interoperabilidad
│   │       ├── pisee/
│   │       │   └── pisee.client.ts       # PISEE 2.0
│   │       ├── fhir/
│   │       │   ├── fhir.client.ts        # Cliente FHIR R4
│   │       │   └── profiles/
│   │       │       └── patient-cl.ts     # Perfil Patient Chile
│   │       ├── nid/                      # Núcleo Interop. Datos
│   │       │   ├── mpi.client.ts         # Master Patient Index
│   │       │   └── hpd.client.ts         # Healthcare Provider Dir
│   │       └── terminologias/
│   │           ├── snomed-ct.ts          # SNOMED CT
│   │           └── cie10.ts              # CIE-10
│   │
│   ├── modules/                          # Módulos CRUD negocio
│   │   └── [nombre-modulo]/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── dto/
│   │       └── routes/
│   │
│   └── shared/                           # Compartidos
│       ├── utils/
│       │   ├── logger.ts                 # Pino estructurado
│       │   └── errors.ts                 # Errores tipados
│       ├── middleware/
│       │   └── validation.middleware.ts  # Zod validation
│       └── routes/
│           └── health.routes.ts          # K8s health checks
│
├── prisma/
│   └── schema.prisma                     # Modelos con auditoría
│
├── plop-templates/                       # Generador CRUD
│
├── infrastructure/
│   └── docker/
│       └── Dockerfile                    # Multi-stage build
│
├── docs/
│   └── NORMATIVAS.md                     # Documentación normativa
│
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## Requisitos del Sistema

- **Node.js** 20+ LTS
- **PostgreSQL** 15+ (datos estructurados con auditoría)
- **Redis** 7+ (caché y sesiones)
- **Docker** & Docker Compose

## Inicio Rápido

```bash
# Clonar plantilla
git clone <repo-url> mi-aplicacion
cd mi-aplicacion

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de ClaveÚnica, etc.

# Levantar servicios (PostgreSQL + Redis)
docker-compose up -d

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Iniciar en desarrollo
npm run dev
```

## Módulos Core

### 1. Autenticación - ClaveÚnica
```typescript
import { claveUnicaService } from '@core/auth/services/claveunica.service';

// Obtener URL de login
const { url, state, nonce } = await claveUnicaService.getAuthorizationUrl();

// Procesar callback
const result = await claveUnicaService.handleCallback(code, state, expectedState, nonce);
// result.user.run = "12345678-9"
```

### 2. Firma Electrónica Avanzada
```typescript
import { firmaElectronicaService } from '@core/firma-electronica/fea.service';

// Firma simple (HMAC)
const docFirmado = await firmaElectronicaService.firmarSimple(
  contenido,
  { run: '12345678-9', nombreCompleto: 'Juan Pérez' },
  claveSecreta
);

// Firma avanzada (RSA con certificado)
const docFEA = await firmaElectronicaService.firmarAvanzada(
  contenido,
  firmante,
  certificadoPEM,
  clavePrivadaPEM
);
```

### 3. Expediente Electrónico
```typescript
import { expedienteService } from '@core/expediente-electronico/expediente.service';

// Crear expediente
const exp = await expedienteService.crearExpediente({
  numero: 'EXP-2025-001',
  materia: 'Solicitud de beneficio',
  institucion: 'MINSAL',
  unidad: 'Depto. Jurídico',
  creadoPor: '12345678-9'
});

// Agregar documento con foliado automático
const { expediente, documento } = await expedienteService.agregarDocumento(exp, {
  tipo: TipoDocumento.SOLICITUD,
  titulo: 'Solicitud inicial',
  archivo: bufferArchivo,
  archivoNombre: 'solicitud.pdf',
  archivoTipo: 'application/pdf',
  agregadoPor: '12345678-9'
});
```

### 4. FHIR R4 con Perfiles Chilenos
```typescript
import { fhirClient } from '@core/interoperability/fhir/fhir.client';
import { buildPatientCL, PREVISION_SALUD } from '@core/interoperability/fhir/profiles/patient-cl';

// Crear paciente según perfil Core CL
const patient = buildPatientCL({
  run: '12345678-9',
  nombres: ['Juan', 'Carlos'],
  apellidoPaterno: 'Pérez',
  apellidoMaterno: 'González',
  fechaNacimiento: new Date('1990-05-15'),
  genero: 'masculino',
  prevision: 'FONASA_B',
  puebloOriginario: 'MAPUCHE'
});

// Enviar a servidor FHIR
const created = await fhirClient.create(patient);
```

### 5. Terminologías Clínicas
```typescript
import { SNOMED_COMMON, createSNOMEDCodeableConcept } from '@core/interoperability/terminologias/snomed-ct';
import { CIE10_COMMON, createCIE10CodeableConcept } from '@core/interoperability/terminologias/cie10';

// SNOMED CT para diagnósticos
const diagnostico = createSNOMEDCodeableConcept(SNOMED_COMMON.DIABETES_TIPO_2);

// CIE-10 para codificación
const codigoCIE = createCIE10CodeableConcept(CIE10_COMMON.E11_9);
```

### 6. Protección de Datos (Ley 19.628)
```typescript
import { proteccionDatosService } from '@core/proteccion-datos/datos-personales.service';

// Registrar consentimiento
const consentimiento = await proteccionDatosService.registrarConsentimiento({
  titularRun: '12345678-9',
  proposito: 'Atención médica',
  categoriasDatos: [CategoriaDato.SALUD],
  baseLegal: BaseLegal.CONSENTIMIENTO,
  textoConsentimiento: 'Autorizo el tratamiento...',
  medioObtencion: 'DIGITAL'
});

// Solicitud ARCO (Acceso, Rectificación, Cancelación, Oposición)
const solicitud = await proteccionDatosService.registrarSolicitudARCO({
  tipo: 'ACCESO',
  solicitanteRun: '12345678-9',
  descripcion: 'Solicito copia de mis datos clínicos'
});
```

## Generación de Módulos CRUD

```bash
# Generar nuevo módulo
npm run generate:module

# Responder prompts:
# > Nombre del módulo (singular): paciente
# > Nombre en plural: pacientes
# > ¿Incluir integración FHIR?: sí

# Estructura generada:
src/modules/paciente/
├── controllers/paciente.controller.ts
├── services/paciente.service.ts
├── repositories/paciente.repository.ts
├── dto/paciente.dto.ts
├── routes/paciente.routes.ts
└── index.ts
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Principales:

```env
# ClaveÚnica (obligatorio)
CLAVEUNICA_CLIENT_ID=
CLAVEUNICA_CLIENT_SECRET=
CLAVEUNICA_REDIRECT_URI=

# Seguridad (obligatorio)
JWT_SECRET=minimo-32-caracteres
ENCRYPTION_KEY=minimo-32-caracteres

# FHIR (para módulos de salud)
FHIR_SERVER_URL=https://fhir.minsal.cl/r4

# NID (Núcleo Interoperabilidad Datos)
MPI_API_URL=
HPD_API_URL=
```

## Scripts Disponibles

```bash
npm run dev              # Desarrollo con hot-reload
npm run build            # Compilar TypeScript
npm run start:prod       # Producción
npm run test             # Tests unitarios
npm run test:e2e         # Tests E2E
npm run lint             # Linter
npm run db:migrate       # Migraciones Prisma
npm run db:studio        # Prisma Studio
npm run generate:module  # Generar módulo CRUD
npm run docs:api         # Generar OpenAPI
npm run audit:security   # Auditoría seguridad
```

## Referencias

### Gobierno Digital
- [Gobierno Digital Chile](https://digital.gob.cl/)
- [Estándares y Guías](https://digital.gob.cl/transformacion-digital/estandares-y-guias/)
- [Kit Digital](https://kitdigital.gob.cl/)
- [CPAT](https://cpat.gob.cl/)

### Salud Digital
- [Interoperabilidad MINSAL](https://interoperabilidad.minsal.cl/)
- [HL7 Chile](https://hl7chile.cl/)
- [CENS](https://cens.cl/)

### Ciberseguridad
- [Ley 21.663](https://www.bcn.cl/leychile/navegar?idNorma=1202434)
- [CSIRT Chile](https://www.csirt.gob.cl/)

---

**Licencia:** MIT - Uso libre en instituciones públicas y privadas de Chile.

*Última actualización: Enero 2026*
