# SRI y Supabase

## Invariantes fiscales

- Ambiente `1` es Pruebas y `2` es Producción. El ambiente se toma del comprobante persistido.
- Recepción usa `RecepcionComprobantesOffline.validarComprobante`.
- Autorización inicial usa `AutorizacionComprobantesOffline.autorizacionComprobante`.
- Vigencia actual usa `ConsultaComprobante.consultarEstadoAutorizacionComprobante`.
- Estados concluyentes de vigencia: `AUTORIZADO`, `NO AUTORIZADO`, `PENDIENTE DE ANULAR` y `ANULADO`.
- Error 99, timeout, SOAP Fault, respuesta inválida o consulta rechazada son inconclusos: registrar el fallo sin cambiar el último estado fiscal válido.
- Código 70 significa clave en procesamiento. Conservar clave, secuencial y XML; no generar otra clave ni reenviar hasta recibir autorización o rechazo. Escalar si sigue inconcluso después de 24 horas.
- `DESC` es descarte local; `ANU` es anulación confirmada por el SRI. Nunca mostrarlos como equivalentes.

La fuente funcional es `Plan_FactuIA/FICHA TE_CNICA COMPROBANTES ELECTRO_NICOS ESQUEMA OFFLINE Versio_n 232.pdf`.

## Cambios de base de datos

1. Compara migraciones locales y remotas antes de crear una nueva.
2. Crea la migración mediante `npx supabase migration new <nombre>`.
3. Usa cambios incrementales e idempotentes. No reescribas migraciones ya aplicadas.
4. Toda tabla expuesta debe tener RLS. Las políticas multiempresa deben filtrar por empresas accesibles al usuario.
5. Para `UPDATE`, define `USING` y `WITH CHECK`; dirige las políticas a roles explícitos.
6. Las funciones `SECURITY DEFINER` requieren `search_path` fijo, validación del usuario y permisos `EXECUTE` mínimos. Prefiere esquemas no expuestos.
7. Las vistas deben usar `security_invoker = true` o permanecer fuera del API público.
8. Indexa claves foráneas, filtros multiempresa y rutas críticas después de revisar el plan con `EXPLAIN`.
9. Las llamadas SOAP ocurren fuera de transacciones. La escritura final debe comprobar ID, clave y ambiente para evitar resultados obsoletos.
10. Ejecuta los asesores de seguridad y rendimiento antes y después de aplicar DDL.

## Realtime y sincronización

- `public.comprobantes` debe estar en `supabase_realtime` y conservar RLS.
- Suscribe el detalle por `id` y el listado bajo el alcance permitido por RLS.
- Usa actualización local o `router.refresh()` después de una acción; Realtime mantiene sincronizadas otras sesiones.
- El polling solo aplica a estados transitorios y debe tener backoff, límite de intentos y pausa al ocultar la pestaña.
- La revalidación de comprobantes ya autorizados es bajo demanda salvo instrucción explícita distinta.
- Para una conciliación sin escrituras ejecuta `npm run sri:audit-status`; usa `-- --ambiente=1` solo cuando necesites el ambiente de pruebas.
