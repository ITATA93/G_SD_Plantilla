# Normativas Chilenas Aplicables

Este documento resume las normativas que esta plantilla cumple para el desarrollo de aplicaciones de Gobierno Digital y Salud en Chile.

## Gobierno Digital

### Ley 21.180 - Transformacion Digital del Estado
- **Publicacion:** 2019
- **Plazo final:** 31 de diciembre de 2027
- **Aplica a:** Todos los organos de la Administracion del Estado

**Requisitos principales:**
- Soporte electronico para todos los procedimientos administrativos
- Eliminacion del papel (cero papel)
- Firma electronica avanzada
- Notificaciones electronicas
- Expediente electronico

**Como la plantilla cumple:**
- Sistema de auditoria con trazabilidad completa
- Soporte para firma electronica (integrable)
- Autenticacion con ClaveUnica

### Ley 21.658 - Secretaria de Gobierno Digital
- **Publicacion:** 2024
- **Entrada en vigencia:** 1 de marzo de 2024

**Requisitos principales:**
- Cumplimiento de estrategia de Gobierno Digital
- Implementacion de plataformas transversales

**Como la plantilla cumple:**
- Integracion con ClaveUnica (identidad digital)
- Integracion con PISEE 2.0 (interoperabilidad)

### Decreto N°11 MINSEGPRES - Norma Tecnica de Plataformas Electronicas
- **Publicacion:** 17 de agosto de 2023

**Requisitos principales:**
- Calidad y funcionamiento de plataformas electronicas
- Estandares de accesibilidad
- Disponibilidad y seguridad

**Como la plantilla cumple:**
- Health checks para monitoreo
- Rate limiting y proteccion DDoS
- Headers de seguridad (Helmet)

---

## Ciberseguridad

### Ley 21.663 - Marco de Ciberseguridad
- **Publicacion:** 8 de abril de 2024
- **Entrada en vigencia:** 1 de enero de 2025 (principales), 1 de marzo de 2025 (criticas)

**Requisitos principales:**
- Sistema de Gestion de Seguridad de la Informacion (SGSI)
- Alineacion con ISO 27001 y NIST
- Seguridad y privacidad desde el diseno
- Reporte de incidentes en 3 horas
- Designacion de delegado de ciberseguridad

**Como la plantilla cumple:**
- Encriptacion AES-256-GCM para datos sensibles
- Rate limiting para prevencion de ataques
- Logging estructurado para deteccion de incidentes
- Sanitizacion de datos en logs (no exponer datos sensibles)
- Headers de seguridad (HSTS, CSP, etc.)
- Validacion de entrada con Zod
- Manejo seguro de errores (no exponer stack traces)

---

## Salud Digital

### Ley 21.541 - Telemedicina
- **Publicacion:** 2023

**Requisitos principales:**
- Acreditacion de plataformas de telemedicina
- Consentimiento informado electronico
- Seguridad de datos de salud

### Ley 21.668 - Interoperabilidad de Fichas Clinicas
- **Publicacion:** 2024

**Requisitos principales:**
- Interoperabilidad con estandar HL7 FHIR
- Acceso del paciente a su informacion clinica
- Trazabilidad de accesos

**Como la plantilla cumple:**
- Cliente FHIR R4 integrado
- Auditoria de accesos a datos de salud
- Soporte para terminologias (SNOMED CT, CIE-10)

### Estandar HL7 FHIR R4
- **Version:** R4 (4.0.1)
- **Adoptado por:** MINSAL

**Recursos soportados:**
- Patient (Paciente)
- Practitioner (Profesional)
- Observation (Observacion clinica)
- Condition (Condicion/Diagnostico)
- MedicationRequest (Prescripcion)

**Terminologias:**
- SNOMED CT (terminologia clinica)
- CIE-10/CIE-11 (clasificacion enfermedades)
- LOINC (laboratorio)
- Terminologia Farmaceutica Chilena

---

## Interoperabilidad

### PISEE 2.0 - Plataforma de Integracion de Servicios del Estado
- **Operador:** Secretaria de Gobierno Digital
- **Arquitectura:** REST (recomendado)

**Servicios comunes:**
- Consulta de datos del Registro Civil
- Verificacion de documentos
- Notificaciones electronicas

**Como la plantilla cumple:**
- Cliente PISEE integrado
- Auditoria de todas las consultas
- Manejo de errores y reintentos

---

## Referencias

### Gobierno Digital
- [Portal Gobierno Digital](https://digital.gob.cl/)
- [Estandares y Guias](https://digital.gob.cl/transformacion-digital/estandares-y-guias/)
- [Kit Digital](https://kitdigital.gob.cl/)
- [Guia Digital](https://www.guiadigital.gob.cl/)

### Salud Digital
- [Interoperabilidad MINSAL](https://interoperabilidad.minsal.cl/)
- [HL7 Chile](https://hl7chile.cl/)
- [CENS - Centro Nacional en Sistemas de Informacion en Salud](https://cens.cl/)

### Ciberseguridad
- [CSIRT Chile](https://www.csirt.gob.cl/)
- [Agencia Nacional de Ciberseguridad](https://anci.gob.cl/)

---

*Ultima actualizacion: Enero 2026*
