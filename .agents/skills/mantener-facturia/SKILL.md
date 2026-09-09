---
name: mantener-facturia
description: Mantener, actualizar, corregir o desplegar FacturIA con controles obligatorios para SRI, Supabase, documentacion y CI/CD. Usar en cambios de codigo, esquema, dependencias, infraestructura o flujos de comprobantes del repositorio FacturIA.
---

# Mantener FacturIA

Trabaja desde la raiz del repositorio y lee primero `AGENTS.md`. Conserva los cambios ajenos y no amplíes el alcance sin autorización.

## Flujo obligatorio

1. Inspecciona `git status`, los archivos implicados, `package.json` y los workflows afectados.
2. Identifica si el cambio toca SRI, Supabase, autenticación, pagos, correo, IA o despliegue. Lee la referencia correspondiente antes de modificarlo.
3. Implementa en unidades pequeñas, sin secretos, datos personales en logs ni permisos más amplios de lo necesario.
4. Añade pruebas de comportamiento y casos de error. Las pruebas automáticas del SRI usan mocks o ambiente 1; nunca ambiente 2.
5. Ejecuta `npm run lint:strict`, `npm run test` y `npm run build`. Corrige errores y warnings introducidos.
6. Si habrá commit, ejecuta nuevamente `npm run build` después de la última corrección. El mensaje del commit debe estar en español y sin caracteres especiales.
7. Actualiza la documentación afectada en el mismo cambio: README, variables, migraciones, estados, operación y rollback.
8. Después de una implementación aprobada, actualiza el issue de Linear correspondiente y publica un resumen verificable en `#facturia` de Slack. No marques como terminado algo que no fue probado.

## Límites de seguridad

- No expongas `SUPABASE_SERVICE_ROLE_KEY`, certificados, contraseñas, XML completos ni datos fiscales en clientes o logs.
- Toda operación sensible debe obtener usuario y empresa en el servidor y depender de RLS; no aceptes `empresa_id`, ambiente SRI ni clave de acceso como autoridad del navegador.
- Una respuesta externa inconclusa conserva el último estado válido y registra el error.
- No apliques migraciones remotas, despliegues ni mensajes externos fuera del alcance autorizado por el usuario.

## Referencias

- Para comprobantes, SOAP, vigencia fiscal, migraciones, RLS o Realtime, lee [SRI y Supabase](references/sri-supabase.md).
- Para validación, GitHub Actions, AWS App Runner, documentación, Linear y Slack, lee [CI/CD y documentación](references/cicd-documentacion.md).
