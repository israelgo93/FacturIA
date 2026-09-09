# AGENTS.md

## Propósito

Estas instrucciones aplican a todos los agentes que trabajen en FacturIA. Antes de modificar el repositorio, revisa este archivo y usa la skill [mantener-facturia](.agents/skills/mantener-facturia/SKILL.md) cuando la tarea sea de mantenimiento, actualización, corrección o despliegue.

FacturIA es una aplicación Next.js 16 App Router, no es monorepo. Usa JavaScript ES2024, React 19, Tailwind CSS 4, Supabase, Stripe, Resend, Gemini, SOAP del SRI, Vitest, Playwright y AWS App Runner.

## Reglas obligatorias

1. Conserva los cambios existentes del usuario y limita las modificaciones al alcance solicitado.
2. No uses `any`, `as any` ni escapes equivalentes si se incorpora TypeScript. Define o amplía los tipos reales.
3. En switches sobre uniones o enums TypeScript, usa una comprobación `never` en el caso por defecto.
4. No expongas secretos, certificados, XML completos ni datos fiscales en código cliente, logs, documentación o respuestas.
5. No aceptes desde el navegador `empresa_id`, ambiente SRI, clave de acceso, roles o permisos como fuente de autoridad. Obténlos en el servidor y aplica RLS.
6. Usa `apply_patch` para editar archivos. En PowerShell no uses HEREDOC ni redirecciones improvisadas para generar contenido.
7. No reescribas migraciones que ya hayan sido aplicadas. Crea cambios incrementales con `npx supabase migration new <nombre>`.
8. Antes de un commit solicitado, ejecuta build, corrige errores y warnings, ejecuta las pruebas y repite el build después de la última corrección.
9. Los mensajes de commit deben estar en español y sin caracteres especiales.
10. No hagas commit, push, deploy, migración remota ni publicaciones externas salvo que formen parte del alcance autorizado.

## SRI: invariantes fiscales

- Ambiente `1`: Pruebas. Ambiente `2`: Producción.
- Recepción inicial: `RecepcionComprobantesOffline`.
- Autorización inicial: `AutorizacionComprobantesOffline`.
- Vigencia actual y anulaciones: `ConsultaComprobante`.
- Estados de vigencia: `AUTORIZADO`, `NO AUTORIZADO`, `PENDIENTE DE ANULAR`, `ANULADO`.
- Mapeo interno: `AUT`, `NAT`, `PAN`, `ANU`.
- `DESC` significa descarte local y nunca debe mostrarse como anulación confirmada por el SRI.
- Una consulta rechazada, código 99, timeout, SOAP Fault o respuesta inválida es inconclusa: conserva el último estado válido y registra el error.
- Ante código 70 conserva la misma clave, secuencial y XML. No generes otra clave ni reenvíes hasta obtener autorización o rechazo; escala después de 24 horas.
- Las pruebas automatizadas del SRI usan mocks o ambiente de pruebas. No ejecutes pruebas exploratorias en producción.

La fuente funcional está en `Plan_FactuIA/FICHA TE_CNICA COMPROBANTES ELECTRO_NICOS ESQUEMA OFFLINE Versio_n 232.pdf`.

## Supabase

- El proyecto remoto se consulta mediante el MCP `facturia-supabase`.
- Antes de DDL, compara tablas, migraciones y asesores con el estado local.
- Toda tabla expuesta debe tener RLS y políticas multiempresa.
- Las políticas `UPDATE` necesitan `USING` y `WITH CHECK`; usa roles explícitos.
- Prefiere vistas `security_invoker`.
- Toda función `SECURITY DEFINER` debe tener `search_path` fijo, comprobar identidad cuando corresponda y limitar `EXECUTE` al mínimo necesario.
- Indexa claves foráneas y columnas usadas por filtros o RLS. Verifica rutas críticas con `EXPLAIN`.
- No mantengas una transacción abierta durante llamadas a servicios externos.
- Después de DDL, verifica columnas, restricciones, índices, RLS, publicación Realtime y vuelve a ejecutar asesores.

## Comandos de desarrollo

| Objetivo | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Lint | `npm run lint` |
| Lint sin warnings | `npm run lint:strict` |
| Pruebas unitarias | `npm run test` |
| Build de producción | `npm run build` |
| Pruebas E2E | `npm run test:e2e` |

El servidor local usa el puerto 3000. Supabase es externo y las pruebas unitarias no deben depender de él.

## Variables y credenciales

- Next.js carga secretos locales desde `.env.local`, que no se versiona.
- Las variables públicas se limitan a `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` y `NEXT_PUBLIC_APP_NAME`.
- `SUPABASE_SERVICE_ROLE_KEY`, Stripe, Resend, Gemini y certificados son exclusivamente de servidor.
- Las URLs SRI requeridas son recepción, autorización y consulta para ambos ambientes.
- `TEST_LOGIN_USERNAME` y `TEST_LOGIN_PASSWORD` permiten pruebas E2E autenticadas cuando están disponibles. No los imprimas.

## CI/CD

- `.github/workflows/ci.yml` corre en cada pull request con Node 22: `npm ci`, lint estricto, build y tests.
- `.github/workflows/deploy-aws.yml` corre al hacer push a `main` o manualmente.
- El deploy construye el `Dockerfile`, etiqueta la imagen con el SHA y `latest`, y la publica en Amazon ECR para AWS App Runner.
- El workflow de deploy no aplica migraciones Supabase. Toda migración requerida debe aplicarse y verificarse antes de desplegar código dependiente.
- Mantén alineadas las versiones de Node del workflow, Dockerfile y documentación.

## Documentación y cierre

Actualiza README cuando cambien variables, arquitectura, estados, integraciones, comandos o procedimientos. Documenta la migración, verificación, riesgos y rollback.

Cuando el proyecto o el usuario lo requiera:

1. Crea o actualiza el issue del proyecto `FacturIA` en Linear con criterios de aceptación y evidencia.
2. Publica en `#facturia` de Slack un resumen de implementación, migraciones, lint, pruebas, build y pendientes manuales.
3. No declares un trabajo terminado si falta aplicar una migración requerida, validar el build o verificar el comportamiento solicitado.
