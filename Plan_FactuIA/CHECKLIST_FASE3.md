# facturIA - Checklist Fase 3: Motor de Facturacion Electronica

## Estado: COMPLETADA
**Fecha:** 6 de febrero de 2026
**Stack:** Next.js 16.1.6 | React 19.2.4 | JavaScript (ES2024) | Supabase | Tailwind CSS 4 | Zod 4.3.6
**IA:** Google Gemini 3 Flash (`gemini-3-flash-preview`) via @google/genai + Vercel AI SDK (@ai-sdk/google)
**Node.js:** v25.2.1 | npm 11.6.2 | Windows 11

---

## A. Preparacion del Entorno
- [x] Dependencias npm instaladas: @google/genai, ai, @ai-sdk/google, fast-xml-parser, xml-crypto, soap, @react-pdf/renderer, pdf-lib, resend
- [x] vitest instalado como devDependency
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` agregada a `.env.local` (para Vercel AI SDK)
- [x] `.cursor/rules/project.mdc` actualizado con nuevo stack IA + dependencias Fase 3
- [x] Scripts `test` y `test:watch` agregados a `package.json`

## B. Migraciones Base de Datos (via MCP Supabase)
- [x] Migracion `alter_comprobantes_fase3` — Campos comprador, XML content, indices
- [x] Migracion `alter_secuenciales_fase3` — establecimiento_id, constraint v2, funcion `next_secuencial()`
- [x] Migracion `create_comprobante_impuestos_pagos` — Tablas comprobante_impuestos + comprobante_pagos
- [x] RLS habilitado en tablas nuevas (comprobante_impuestos, comprobante_pagos)
- [x] Politicas tenant creadas para ambas tablas
- [x] Indices creados (idx_impuestos_detalle, idx_pagos_comprobante, idx_comprobantes_tipo_fecha, idx_comprobantes_cliente)

## C. Motor SRI Core
- [x] `src/lib/sri/clave-acceso.js` — Generador clave 49 digitos + Modulo 11 + validacion + descomposicion
- [x] `src/lib/sri/secuencial-manager.js` — Secuenciales atomicos via funcion SQL + numero completo
- [x] `src/lib/sri/xml-builder.js` — Constructor XML factura v1.1.0 (infoTributaria, infoFactura, detalles, impuestos, pagos, infoAdicional)
- [x] `src/lib/sri/xml-signer.js` — Firma XAdES-BES con .p12 (node-forge + xml-crypto, RSA-SHA1, ENVELOPED)
- [x] `src/lib/sri/soap-client.js` — Cliente SOAP WS SRI (enviarComprobante, consultarAutorizacion)
- [x] `src/lib/sri/validators.js` — Validaciones factura (emisor, comprador, detalles, pagos, totales)
- [x] `src/lib/sri/comprobante-orchestrator.js` — Flujo completo: draft -> signed -> sent -> AUT/NAT/PPR/DEV
- [x] `src/lib/sri/ride-generator.js` — Generador RIDE PDF con @react-pdf/renderer

## D. Migracion IA a Gemini 3 Flash
- [x] `src/lib/ia/gemini-client.js` — Cliente @google/genai con gemini-3-flash-preview + fallback gemini-2.5-flash
- [x] `src/lib/ia/factura-prompts.js` — System prompts wizard factura + analisis errores SRI
- [x] `src/lib/ia/error-analyzer.js` — Analisis errores SRI con Gemini (explicacion + solucion + severidad)
- [x] `src/app/api/ia/factura-wizard/route.js` — API Route Vercel AI SDK streaming con tools (buscarCliente, buscarProducto, calcularTotales)

## E. Server Actions y API Routes
- [x] `src/app/(dashboard)/comprobantes/actions.js` — crearBorrador, procesarComprobante, anularComprobante, listarComprobantes, obtenerComprobante
- [x] `src/app/api/sri/enviar/route.js` — Envio a WS Recepcion SRI
- [x] `src/app/api/sri/autorizar/route.js` — Consulta WS Autorizacion SRI
- [x] `src/app/api/comprobantes/ride/route.js` — Genera RIDE PDF
- [x] `src/app/api/comprobantes/email/route.js` — Envia email con XML + RIDE adjuntos

## F. Frontend - Wizard Factura
- [x] `src/stores/useComprobanteStore.js` — Store Zustand (wizard state, detalles, pagos, totales, reset)
- [x] `src/hooks/useFacturaWizard.js` — Hook wizard con validacion por paso + envio
- [x] `src/components/wizard/WizardFactura.jsx` — Contenedor principal 5 pasos con progress bar
- [x] `src/components/wizard/StepCliente.jsx` — Seleccion establecimiento/punto + busqueda/datos comprador
- [x] `src/components/wizard/StepDetalles.jsx` — Busqueda productos + agregar/editar/eliminar + totales
- [x] `src/components/wizard/StepPagos.jsx` — Formas de pago (agregar/eliminar, auto-total)
- [x] `src/components/wizard/StepResumen.jsx` — Vista previa completa (comprador, detalles, pagos, totales)
- [x] `src/components/wizard/StepConfirmacion.jsx` — Resultado procesamiento (AUT/NAT/PPR/DEV)
- [x] `src/components/wizard/IAAssistant.jsx` — Panel chat IA con Vercel AI SDK useChat
- [x] `src/app/(dashboard)/comprobantes/nuevo/page.js` — Pagina wizard nueva factura

## G. Componentes Comprobantes
- [x] `src/components/comprobantes/StatusBadge.jsx` — Badge estado con colores (draft, signed, sent, AUT, NAT, DEV, voided)
- [x] `src/components/comprobantes/ComprobanteList.jsx` — Tabla con filtros (estado, busqueda), paginacion
- [x] `src/components/comprobantes/ComprobanteDetalle.jsx` — Detalle comprobante (emisor, comprador, detalles, totales, acciones)
- [x] `src/components/comprobantes/ComprobanteTimeline.jsx` — Timeline visual de estados (creado -> firmado -> enviado -> autorizado)
- [x] `src/app/(dashboard)/comprobantes/page.js` — Pagina listado con ComprobanteList (reescrita)
- [x] `src/app/(dashboard)/comprobantes/[id]/page.js` — Pagina detalle comprobante

## H. RIDE PDF y Email
- [x] `src/components/pdf/RIDETemplate.jsx` — Template React-PDF conforme formato SRI (header, comprador, detalles, totales, pagos, clave acceso)
- [x] `src/lib/email/resend-client.js` — Cliente Resend para envio email con XML + RIDE adjuntos + template HTML

## I. Validaciones
- [x] `src/lib/validations/factura.js` — Schemas Zod por paso: clienteStepSchema, detallesStepSchema, pagosStepSchema, facturaSchema

## J. Tests
- [x] `vitest.config.js` — Configuracion Vitest con alias @/
- [x] `tests/unit/sri/clave-acceso.test.js` — 21 tests: Modulo 11, generacion, validacion, descomposicion
- [x] `tests/unit/sri/xml-builder.test.js` — 10 tests: estructura XML, datos emisor/comprador, detalles, impuestos, totales, pagos
- [x] `tests/unit/sri/validators.test.js` — 15 tests: validacion factura, totales impuestos, calculos
- [x] **46 tests pasando (0 fallidos)**

## K. Verificacion Final
- [x] `npm run build` exitoso (27 rutas, 0 errores)
- [x] `npm test` — 46 tests pasando
- [x] Security advisors verificados (solo advertencia menor de leaked password protection, no relacionada con Fase 3)

---

## Resumen Numerico
| Categoria | Cantidad |
|-----------|----------|
| Dependencias nuevas | 10 (@google/genai, ai, @ai-sdk/google, fast-xml-parser, xml-crypto, soap, @react-pdf/renderer, pdf-lib, resend, vitest) |
| Migraciones BD | 3 (alter comprobantes, alter secuenciales, create impuestos+pagos) |
| Tablas nuevas | 2 (comprobante_impuestos, comprobante_pagos) |
| Tablas modificadas | 2 (comprobantes, secuenciales) |
| Funciones SQL | 1 (next_secuencial) |
| Motor SRI (lib) | 8 archivos |
| Motor IA (lib) | 3 archivos |
| API Routes nuevas | 5 |
| Server Actions | 1 archivo (~5 funciones) |
| Componentes UI nuevos | 10 (wizard 7 + comprobantes 4 + pdf 1) |
| Paginas nuevas/modificadas | 4 |
| Stores nuevos | 1 (useComprobanteStore) |
| Hooks nuevos | 1 (useFacturaWizard) |
| Validaciones Zod nuevas | 1 (factura) |
| Tests unitarios | 46 (3 archivos) |
| **Total archivos creados/modificados** | **~40** |

## Rutas de la Aplicacion (27 total, 6 nuevas)
```
Nuevas en Fase 3:
/comprobantes/nuevo              -> Wizard nueva factura (5 pasos)
/comprobantes/[id]               -> Detalle comprobante + timeline + acciones
/api/ia/factura-wizard           -> Chat IA wizard (Vercel AI SDK streaming)
/api/sri/enviar                  -> Envio WS Recepcion SRI
/api/sri/autorizar               -> Consulta WS Autorizacion SRI
/api/comprobantes/ride           -> Genera RIDE PDF
/api/comprobantes/email          -> Envia email con XML + RIDE

Modificadas en Fase 3:
/comprobantes                    -> Listado con tabla real, filtros, paginacion (antes era placeholder)
```

## Flujo Completo del Motor
```
1. CREAR (wizard 5 pasos)
   └── Establecimiento + Punto Emision
   └── Datos comprador (busqueda o manual)
   └── Productos/servicios (busqueda, cantidades, IVA)
   └── Formas de pago
   └── Resumen y confirmacion

2. PROCESAR (Server Action → Orquestador)
   └── crearBorrador() → estado: draft
   └── generarClaveAcceso() → 49 digitos Modulo 11
   └── buildFacturaXML() → XML v1.1.0
   └── firmarXML() → XAdES-BES con .p12
   └── enviarComprobante() → WS Recepcion SRI
   └── consultarAutorizacion() → WS Autorizacion (con reintentos)
   └── Estado final: AUT / NAT / PPR / DEV

3. ENTREGAR (API Routes)
   └── Genera RIDE PDF
   └── Envia email con XML + RIDE adjuntos
```
