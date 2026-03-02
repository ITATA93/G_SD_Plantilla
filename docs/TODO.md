# TODO — G_SD_Plantilla

## Completados

- [x] Validar integracion ClaveUnica con endpoints reales
  - Tests de integracion con mocks en `tests/integration/claveunica.test.ts`
  - Cubre: redirect, callback, token exchange, perfil, errores
- [x] Configurar CI/CD pipeline para tests de compliance
  - Pipeline en `.github/workflows/compliance.yml`
  - Jobs: lint, tests unitarios, tests seguridad, E2E, reporte compliance
- [x] Documentar flujo de firma electronica avanzada (FEA)
  - Documentacion completa en `docs/flujo_fea.md`
  - Referencia Ley 19.799, DS-181, diagrama de secuencia completo
- [x] Agregar tests de seguridad (OWASP Top 10)
  - Tests en `tests/security/owasp.test.ts`
  - Cubre: XSS/CSP, SQLi, CSRF, auth bypass, headers, logging, crypto

## Backlog

- [ ] Template generator para nuevos modulos de normativa
- [ ] Integracion con PISEE (Plataforma de Interoperabilidad)
