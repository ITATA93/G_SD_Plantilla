---
depends_on: []
impacts: [CHANGELOG.md]
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — 2026-03-11

### Added

- Initial project setup from AG_Plantilla.
- Tests de integracion ClaveUnica con mocks (`tests/integration/claveunica.test.ts`): redirect, callback, token exchange, perfil de usuario, escenarios de error.
- Pipeline CI/CD de compliance (`.github/workflows/compliance.yml`): lint, tests unitarios, tests de seguridad OWASP, E2E con Playwright, auditoria npm, reporte consolidado.
- Documentacion del flujo de Firma Electronica Avanzada (`docs/flujo_fea.md`): referencia Ley 19.799, DS-181, diagrama de secuencia, pasos detallados (solicitud, verificacion identidad, hash, firma HSM, sello de tiempo, validacion).
- Tests de seguridad OWASP Top 10 (`tests/security/owasp.test.ts`): XSS/CSP, SQL injection, CSRF, autenticacion, datos sensibles, headers de seguridad, logging, diseno seguro, componentes vulnerables.
