# Flujo de Firma Electronica Avanzada (FEA)

## Marco Legal

### Ley 19.799 - Sobre Documentos Electronicos, Firma Electronica y Servicios de Certificacion
Publicada el 12 de abril de 2002, establece el marco legal para la firma electronica en Chile. Define dos tipos de firma:

| Tipo | Definicion | Valor legal |
|------|-----------|-------------|
| **Firma Electronica Simple (FES)** | Cualquier sonido, simbolo o proceso electronico que permite identificar al firmante | Admisible en juicio, sujeta a apreciacion del juez |
| **Firma Electronica Avanzada (FEA)** | Creada usando medios bajo control exclusivo del firmante, con certificado de prestador acreditado | Equivalente a firma manuscrita. Presuncion de autenticidad |

### Decreto Supremo N° 181 (DS-181)
Reglamento de la Ley 19.799. Establece los requisitos tecnicos para:
- Prestadores de servicios de certificacion (PSC)
- Certificados de firma electronica avanzada
- Infraestructura de clave publica (PKI)
- Sellado de tiempo (timestamping)

### Prestadores de Servicios de Certificacion Acreditados
Los PSC acreditados ante el Ministerio de Economia emiten certificados FEA validos:
- E-Sign S.A.
- Acepta.com (actual TOC)
- Certinet S.A.
- Thomas Signe Chile

---

## Arquitectura del Flujo FEA

### Diagrama General

```
+-------------------+     +--------------------+     +------------------+
|                   |     |                    |     |                  |
|  1. Solicitud     +---->+  2. Verificacion   +---->+  3. Hash del     |
|     de Firma      |     |     de Identidad   |     |     Documento    |
|                   |     |     (ClaveUnica)    |     |                  |
+-------------------+     +--------------------+     +--------+---------+
                                                              |
                                                              v
+-------------------+     +--------------------+     +------------------+
|                   |     |                    |     |                  |
|  6. Validacion    +<----+  5. Estampado de   +<----+  4. Firma con    |
|     y Archivo     |     |     Tiempo (TSA)   |     |     HSM / Cert   |
|                   |     |                    |     |                  |
+-------------------+     +--------------------+     +------------------+
```

### Flujo Detallado Paso a Paso

---

### Paso 1: Solicitud de Firma

El usuario o sistema solicita firmar un documento electronico.

**Datos de entrada:**
- Documento a firmar (PDF, XML, o buffer binario)
- Identificacion del firmante (RUN)
- Tipo de firma solicitada (SIMPLE o AVANZADA)
- Metadatos opcionales (cargo, institucion)

**Implementacion en la plantilla:**
```typescript
import { firmaElectronicaService } from '@core/firma-electronica/fea.service';

// El servicio recibe el contenido y datos del firmante
const contenido = Buffer.from(documentoPDF);
const firmante = {
  run: '12345678-9',
  nombreCompleto: 'Juan Perez Gonzalez',
  cargo: 'Jefe de Departamento',
  institucion: 'MINSAL',
};
```

**Evento de auditoria generado:**
- `action: 'SIGNATURE_REQUESTED'`
- `resourceType: 'FirmaElectronica'`
- Registro del solicitante y timestamp

---

### Paso 2: Verificacion de Identidad (ClaveUnica)

Antes de firmar, se verifica la identidad del firmante mediante ClaveUnica (OpenID Connect).

**Proceso:**
1. El firmante es redirigido a `https://accounts.claveunica.gob.cl/openid/authorize`
2. Ingresa sus credenciales en ClaveUnica
3. ClaveUnica retorna un `code` y `state` al callback
4. Se intercambia el `code` por tokens (access_token, id_token)
5. Se obtiene el perfil del usuario via `userinfo`
6. Se verifica que el RUN del firmante coincida con el RUN autenticado

**Validaciones criticas:**
- El `state` debe coincidir para prevenir CSRF
- El `nonce` se verifica en el `id_token`
- El `access_token` debe estar vigente
- El RUN del usuario autenticado debe coincidir con el firmante declarado

**Implementacion:**
```typescript
import { claveUnicaService } from '@core/auth/services/claveunica.service';

// 1. Generar URL de autorizacion
const { url, state, nonce } = await claveUnicaService.getAuthorizationUrl();

// 2. Redirigir al usuario a ClaveUnica
// ... (el usuario se autentica en ClaveUnica)

// 3. Procesar callback
const authResult = await claveUnicaService.handleCallback(code, state, expectedState, nonce);

// 4. Verificar que el RUN coincida con el firmante
if (authResult.user.run !== firmante.run) {
  throw new Error('El RUN autenticado no coincide con el firmante');
}
```

---

### Paso 3: Hash del Documento

Se calcula el hash criptografico del documento para garantizar su integridad.

**Algoritmo:** SHA-256 (recomendado por DS-181 y NIST)

**Proceso:**
1. Se lee el contenido completo del documento
2. Se aplica SHA-256 sobre el contenido binario
3. Se obtiene un digest de 256 bits (64 caracteres hexadecimales)
4. Este hash es lo que se firma (no el documento completo)

**Implementacion:**
```typescript
// El servicio calcula el hash internamente
const hashOriginal = firmaElectronicaService.calcularHash(contenido);
// Ejemplo de resultado: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
```

**Importancia del hash:**
- Garantiza integridad: cualquier modificacion al documento cambia el hash
- Eficiencia: se firma un valor de tamano fijo (32 bytes) en vez del documento completo
- No reversibilidad: no se puede reconstruir el documento a partir del hash

---

### Paso 4: Firma con HSM / Certificado Digital

Se firma el hash del documento usando la clave privada del firmante.

#### Opcion A: Firma con Certificado Local (PEM)

Para ambientes de desarrollo o certificados almacenados localmente:

```typescript
const docFEA = await firmaElectronicaService.firmarAvanzada(
  contenido,
  firmante,
  certificadoPEM,   // Certificado X.509 del firmante
  clavePrivadaPEM,  // Clave privada RSA
  passphrase        // Passphrase opcional de la clave
);
```

**Proceso interno:**
1. Cargar y validar el certificado X.509 (vigencia, emisor)
2. Cargar la clave privada RSA (descifrar si tiene passphrase)
3. Crear digest SHA-256 del hash del documento
4. Firmar el digest con la clave privada (RSA-SHA256)
5. Codificar la firma en Base64

#### Opcion B: Firma con HSM (Hardware Security Module)

Para ambientes de produccion con certificados en HSM:

```
+------------------+     +------------------+     +------------------+
|  Aplicacion      |     |  HSM Gateway     |     |  HSM Device      |
|  (esta plantilla)|---->|  (API REST/PKCS) |---->|  (Clave privada) |
|                  |     |                  |     |  (Certificado)   |
+------------------+     +------------------+     +------------------+
```

**Ventajas del HSM:**
- La clave privada nunca sale del dispositivo
- Proteccion fisica contra extraccion
- Cumple con requisitos de nivel de seguridad DS-181
- Auditoria de uso de claves

**Proveedores HSM compatibles:**
- Thales Luna Network HSM
- AWS CloudHSM
- Azure Dedicated HSM
- Utimaco SecurityServer

---

### Paso 5: Estampado de Tiempo (TSA - Time Stamp Authority)

Se agrega una marca de tiempo confiable a la firma para demostrar cuando se firmo.

**Protocolo:** RFC 3161 (Internet X.509 PKI Time-Stamp Protocol)

**Proceso:**
1. Se genera un Time Stamp Request (TSR) con el hash de la firma
2. Se envia a una TSA acreditada
3. La TSA responde con un Time Stamp Token (TST) firmado
4. El TST se adjunta al documento firmado

```
+------------------+                    +------------------+
|  Aplicacion      |  -- TSRequest -->  |  TSA Acreditada  |
|  (hash firma)    |  <-- TSToken ---   |  (certificado    |
|                  |                    |   de tiempo)     |
+------------------+                    +------------------+
```

**TSA disponibles en Chile:**
- E-Sign TSA (tsa.esign.cl)
- Acepta TSA (tsa.acepta.com)

**Importancia:**
- Demuestra que la firma existia en un momento determinado
- Protege contra repudio temporal
- Requerido por DS-181 para FEA en tramites del Estado

---

### Paso 6: Validacion y Archivo

Se valida la firma completa y se archiva el documento firmado.

**Validaciones realizadas:**
1. **Integridad del documento:** Recalcular hash y comparar
2. **Validez de la firma:** Verificar con clave publica del certificado
3. **Vigencia del certificado:** Verificar fechas notBefore y notAfter
4. **Cadena de confianza:** Verificar que el certificado fue emitido por un PSC acreditado
5. **Estado de revocacion:** Consultar CRL u OCSP del PSC
6. **Sello de tiempo:** Verificar TST si esta presente

**Implementacion:**
```typescript
// Verificacion de FEA
const resultado = await firmaElectronicaService.verificarFirmaAvanzada(
  contenidoOriginal,
  documentoFirmado,
  certificadoPEM
);

// resultado.valido: boolean
// resultado.detalles.hashCoincide: boolean
// resultado.detalles.firmaValida: boolean
// resultado.detalles.certificadoVigente: boolean
```

**Evento de auditoria:**
- `action: 'SIGNATURE_VERIFIED'`
- `resourceType: 'VerificacionFEA'`
- Resultado de la verificacion registrado

---

## Estructura del Documento Firmado

```typescript
interface DocumentoFirmado {
  documentoId: string;        // UUID unico
  hashOriginal: string;       // SHA-256 del contenido
  firma: string;              // Firma digital (Base64)
  algoritmo: string;          // 'RSA-SHA256' para FEA
  tipoFirma: 'AVANZADA';     // Tipo segun Ley 19.799
  fechaFirma: Date;           // Timestamp de la firma
  firmante: {
    run: string;              // RUN del firmante
    nombreCompleto: string;   // Nombre completo
    cargo?: string;           // Cargo institucional
    institucion?: string;     // Institucion
  };
  certificadoSerial?: string; // Serial del certificado X.509
}
```

---

## Consideraciones de Seguridad

### Requisitos Ley 21.663 (Ciberseguridad)
- Claves privadas almacenadas en HSM o medios seguros
- Registro de auditoria de todas las operaciones de firma
- Notificacion de incidentes en 3 horas al CSIRT
- Cifrado de claves en reposo (AES-256-GCM)

### Requisitos DS-181
- Certificados emitidos por PSC acreditados ante el Ministerio de Economia
- Algoritmos criptograficos aprobados (RSA >= 2048 bits, SHA-256+)
- Sello de tiempo de TSA acreditada
- Verificacion de revocacion de certificados (CRL/OCSP)

### Buenas Practicas
- Nunca almacenar claves privadas en texto plano
- Usar passphrase para proteger claves privadas en archivos PEM
- Rotar certificados antes de su vencimiento
- Mantener registros de auditoria por al menos 6 anios (Ley 21.180)
- Implementar verificacion de cadena de confianza completa

---

## Diagrama de Secuencia Completo

```
Usuario         App             ClaveUnica       HSM/Cert        TSA
  |              |                  |               |              |
  |--solicitar-->|                  |               |              |
  |  firma       |                  |               |              |
  |              |--redirect------->|               |              |
  |              |                  |               |              |
  |<-------------|<--callback-------|               |              |
  |              |  (code+state)    |               |              |
  |              |                  |               |              |
  |              |--token exchange->|               |              |
  |              |<--tokens---------|               |              |
  |              |                  |               |              |
  |              |--userinfo------->|               |              |
  |              |<--perfil---------|               |              |
  |              |                  |               |              |
  |              |  [calcular hash SHA-256]         |              |
  |              |                  |               |              |
  |              |--firmar hash-------------------->|              |
  |              |<--firma digital------------------|              |
  |              |                  |               |              |
  |              |--solicitar sello tiempo------------------------>|
  |              |<--TST firmado----------------------------------------|
  |              |                  |               |              |
  |              |  [archivar documento firmado]     |              |
  |              |  [registrar auditoria]           |              |
  |              |                  |               |              |
  |<--resultado--|                  |               |              |
  |  firmado     |                  |               |              |
```

---

## Referencias

- [Ley 19.799 - Firma Electronica](https://www.bcn.cl/leychile/navegar?idNorma=196640)
- [DS N° 181 - Reglamento Ley 19.799](https://www.bcn.cl/leychile/navegar?idNorma=201668)
- [Ley 21.663 - Marco de Ciberseguridad](https://www.bcn.cl/leychile/navegar?idNorma=1202434)
- [Ley 21.180 - Transformacion Digital del Estado](https://www.bcn.cl/leychile/navegar?idNorma=1138479)
- [RFC 3161 - Time-Stamp Protocol](https://datatracker.ietf.org/doc/html/rfc3161)
- [Entidad Acreditadora de PSC - Ministerio de Economia](https://www.economia.gob.cl/areas-de-trabajo/sernac-y-organismos-del-consumidor/entidad-acreditadora)
- [Gobierno Digital - Estandares y Guias](https://digital.gob.cl/transformacion-digital/estandares-y-guias/)
- [NIST SP 800-57 - Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

---

*Ultima actualizacion: Marzo 2026*
