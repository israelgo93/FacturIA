# CI/CD y documentación

## Validación local

Ejecuta, en este orden, después de implementar:

1. `npm run lint:strict`
2. `npm run test`
3. `npm run build`
4. `npm run test:e2e` cuando el cambio afecte navegación, autenticación o un flujo de usuario y exista un entorno de prueba disponible.

Antes de un commit solicitado, corrige todos los errores y warnings aplicables y repite el build después de la última corrección.

## GitHub Actions

- `.github/workflows/ci.yml` se ejecuta en pull requests: checkout, Node 22, `npm ci`, lint estricto, build y tests.
- `.github/workflows/deploy-aws.yml` se ejecuta al hacer push a `main` o manualmente.
- El deploy autentica AWS, construye la imagen definida por `Dockerfile`, publica tags por SHA y `latest` en ECR y deja que AWS App Runner consuma la imagen.
- Mantén Node, lockfile, Dockerfile y workflows en la misma versión soportada.
- No escribas secretos en workflows, logs o documentación; usa GitHub Secrets y variables de entorno.
- Una migración Supabase no se aplica automáticamente por el workflow actual. Debe verificarse y aplicarse mediante el flujo autorizado antes de desplegar código que dependa de ella.

## Documentación y comunicación

Actualiza README cuando cambien variables, comandos, arquitectura, estados, integraciones o procedimientos operativos. Documenta:

- qué cambió y por qué;
- configuración requerida;
- migración y compatibilidad;
- verificación ejecutada;
- riesgos conocidos y rollback.

Para Linear, usa o crea un issue en el proyecto `FacturIA`, registra criterios de aceptación y adjunta evidencia de lint, pruebas y build. Para Slack, publica en `#facturia` un resumen de cambios, migraciones, validaciones y pendientes manuales. Solo realiza estas mutaciones cuando formen parte del trabajo autorizado.
