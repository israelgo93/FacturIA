# facturIA - Checklist Fase 4: Comprobantes Electronicos Adicionales

## Estado: COMPLETADO (funcionalidades core)
**Fecha:** 6 de febrero de 2026
**Stack:** Next.js 16.1.6 | React 19.2.4 | JavaScript (ES2024) | Supabase | Tailwind CSS 4 | Zod 4.3.6
**IA:** Google Gemini 3 Flash (`gemini-3-flash-preview`) via @google/genai + Vercel AI SDK (@ai-sdk/google)
**Node.js:** v25.2.1 | npm 11.6.2 | Windows 11

---

## Pre-requisitos (Fase 3 Completada)
- [x] Generador clave de acceso 49 digitos + Modulo 11
- [x] XML Builder factura v1.1.0
- [x] Firma XAdES-BES con .p12
- [x] Cliente SOAP WS Recepcion + Autorizacion SRI
- [x] Flujo completo orquestado (BORRADOR → AUTORIZADO)
- [x] RIDE PDF (representacion impresa)
- [x] Email automatico XML + RIDE (Resend)
- [x] Wizard factura con IA (Gemini 3 Flash + useChat)
- [x] Listado comprobantes con filtros y estados

---

## A. Migracion Base de Datos - Comprobantes Adicionales

### A.1 Campos adicionales en tabla `comprobantes`
- [x] Campos NC/ND: `doc_sustento_tipo`, `doc_sustento_numero`, `doc_sustento_fecha`, `motivo` (verificar existentes)
- [x] Campos Retencion: `ejercicio_fiscal`, `tipo_sujeto_retenido`, `periodo_fiscal`
- [x] Campos Guia Remision: `dir_partida`, `fecha_inicio_transporte`, `fecha_fin_transporte`, `razon_social_transportista`, `tipo_identificacion_transportista`, `ruc_transportista`, `placa`
- [x] Campos Liquidacion Compra: `razon_social_proveedor`, `identificacion_proveedor`, `tipo_identificacion_proveedor`, `direccion_proveedor`

### A.2 Tabla `guia_remision_destinatarios`
- [x] Crear tabla con campos: id, comprobante_id, empresa_id, identificacion_destinatario, razon_social_destinatario, direccion_destinatario, motivo_traslado, ruta, cod_doc_sustento, num_doc_sustento, num_autorizacion_doc_sustento, fecha_emision_doc_sustento
- [x] RLS habilitado con politica empresa_isolation
- [x] Indices creados

### A.3 Tabla `guia_remision_detalles`
- [x] Crear tabla con campos: id, destinatario_id, empresa_id, codigo_interno, codigo_adicional, descripcion, cantidad
- [x] RLS habilitado con politica empresa_isolation
- [x] Indices creados

### A.4 Verificar tabla `retencion_detalles` (ya existe)
- [x] Verificar estructura existente cumple con requisitos v2.0.0
- [x] Agregar campos faltantes si es necesario

### A.5 Vista resumen comprobantes
- [x] Crear vista `v_comprobantes_resumen` para dashboard

### A.6 Indices adicionales
- [x] Indice `idx_comprobantes_tipo_estado` (empresa_id, tipo_comprobante, estado)
- [x] Indice `idx_comprobantes_fecha_tipo` (empresa_id, fecha_emision DESC, tipo_comprobante)

---

## B. Catalogos SRI - Extension

### B.1 Codigos de Retencion en la Fuente de Renta (codigo impuesto: 1)
- [x] `CODIGOS_RETENCION_RENTA` — 303, 304, 304A-E, 307-343 con porcentajes
- [x] Funcion `getDescripcionRetencionRenta(codigo)` -> `getRetencionRenta()`

### B.2 Codigos de Retencion IVA (codigo impuesto: 2)
- [x] `CODIGOS_RETENCION_IVA` — 1-10 con porcentajes (10%, 20%, 30%, 50%, 70%, 100%, 0%, presuntivo)
- [x] Funcion `getDescripcionRetencionIVA(codigo)` -> `getRetencionIVA()`

### B.3 Codigos de Retencion ISD (codigo impuesto: 6)
- [x] `CODIGOS_RETENCION_ISD` — 4580 (5%)
- [x] Funcion `getDescripcionRetencionISD(codigo)` (incluido en catalogos)

### B.4 Tipos de Documento Sustento
- [x] `TIPOS_DOC_SUSTENTO` — 01-48 segun Tabla 4 SRI

---

## C. XML Builders - Comprobantes Adicionales

### C.1 Nota de Credito (codDoc: 04, v1.1.0)
- [x] Funcion `buildNotaCreditoXML()` en xml-builder.js
- [x] Estructura: infoTributaria, infoNotaCredito, detalles, infoAdicional
- [x] Campos especificos: codDocModificado, numDocModificado, fechaEmisionDocSustento, valorModificacion, motivo
- [ ] Tests unitarios con vectores Ficha Tecnica SRI

### C.2 Nota de Debito (codDoc: 05, v1.0.0)
- [x] Funcion `buildNotaDebitoXML()` en xml-builder.js
- [x] Estructura: infoTributaria, infoNotaDebito, motivos (en lugar de detalles)
- [x] Campos especificos: codDocModificado, numDocModificado, motivos con razon/valor
- [ ] Tests unitarios con vectores Ficha Tecnica SRI

### C.3 Comprobante de Retencion (codDoc: 07, v2.0.0)
- [x] Funcion `buildRetencionXML()` en xml-builder.js
- [x] Estructura: infoTributaria, infoCompRetencion, docsSustento con retenciones
- [x] Campos especificos: periodoFiscal, tipoSujetoRetenido, parteRelacionada, docsSustento[]
- [ ] Tests unitarios con vectores Ficha Tecnica SRI

### C.4 Guia de Remision (codDoc: 06, v1.0.0)
- [x] Funcion `buildGuiaRemisionXML()` en xml-builder.js
- [x] Estructura: infoTributaria, infoGuiaRemision, destinatarios con detalles
- [x] Campos especificos: dirPartida, transportista, placa, fechas transporte, destinatarios[]
- [ ] Tests unitarios con vectores Ficha Tecnica SRI

### C.5 Liquidacion de Compra (codDoc: 03, v1.1.0)
- [x] Funcion `buildLiquidacionCompraXML()` en xml-builder.js
- [x] Estructura similar a factura pero con datos proveedor
- [x] Campos especificos: tipoIdentificacionProveedor, razonSocialProveedor, identificacionProveedor
- [ ] Tests unitarios con vectores Ficha Tecnica SRI

---

## D. Orquestador - Extension para Multiples Tipos

### D.1 Selector de XML Builder
- [x] Funcion `getXMLBuilder(tipoComprobante)` con switch 01/03/04/05/06/07
- [x] Importar todos los builders nuevos

### D.2 Selector de Template RIDE
- [x] Funcion `getRIDETemplate(tipoComprobante)` con mapeo por tipo
- [x] Integrar con ride-generator.js

### D.3 Flujo procesarComprobante extendido
- [x] Switch por tipo para seleccionar builder correcto
- [x] Mantener compatibilidad con factura (01)

---

## E. Validadores por Tipo de Comprobante

### E.1 Validador Nota de Credito
- [x] Schema Zod `notaCreditoSchema`
- [x] Validar documento sustento obligatorio
- [ ] Validar monto no supere factura original (pendiente regla de negocio)
- [x] Validar motivo obligatorio

### E.2 Validador Nota de Debito
- [x] Schema Zod `notaDebitoSchema`
- [x] Validar documento sustento obligatorio
- [x] Validar motivos (razon + valor)

### E.3 Validador Retencion
- [x] Schema Zod `retencionSchema`
- [x] Validar periodo fiscal (mm/aaaa)
- [x] Validar documentos sustento con retenciones
- [x] Validar codigos de retencion validos

### E.4 Validador Guia Remision
- [x] Schema Zod `guiaRemisionSchema`
- [x] Validar transportista obligatorio
- [x] Validar fechas transporte
- [x] Validar al menos un destinatario con items

### E.5 Validador Liquidacion Compra
- [x] Schema Zod `liquidacionCompraSchema`
- [x] Validar datos proveedor obligatorios
- [x] Validar detalles e impuestos

---

## F. Server Actions - CRUD por Tipo

### F.1 Nota de Credito
- [x] `crearNotaCredito()` — Crear borrador NC
- [x] `procesarNotaCredito()` — Flujo completo NC (usa `procesarComprobante()` generico)

### F.2 Nota de Debito
- [x] `crearNotaDebito()` — Crear borrador ND
- [x] `procesarNotaDebito()` — Flujo completo ND (usa `procesarComprobante()` generico)

### F.3 Retencion
- [x] `crearRetencion()` — Crear borrador Ret
- [x] `procesarRetencion()` — Flujo completo Ret (usa `procesarComprobante()` generico)

### F.4 Guia Remision
- [x] `crearGuiaRemision()` — Crear borrador GR
- [x] `procesarGuiaRemision()` — Flujo completo GR (usa `procesarComprobante()` generico)

### F.5 Liquidacion Compra
- [x] `crearLiquidacionCompra()` — Crear borrador LC
- [x] `procesarLiquidacionCompra()` — Flujo completo LC (usa `procesarComprobante()` generico)

### F.6 Buscar Comprobantes para Referencia
- [x] `buscarComprobantesAutorizados()` — Buscar facturas autorizadas para NC/ND/Ret

---

## G. Formularios UI - Comprobantes Adicionales

### G.1 Componentes Compartidos
- [x] `SeleccionarDocumentoSustento.jsx` — Selector de factura base para NC/ND/Ret
- [ ] `useComprobanteForm.js` — Hook generico para formularios (opcional)

### G.2 Nota de Credito
- [x] `src/app/(dashboard)/comprobantes/nota-credito/page.js` — Pagina formulario completa
- [x] Formulario integrado: selector factura + motivo + detalles

### G.3 Nota de Debito
- [x] `src/app/(dashboard)/comprobantes/nota-debito/page.js` — Pagina formulario completa
- [x] Formulario integrado: selector factura + motivos dinamicos

### G.4 Retencion
- [x] `src/app/(dashboard)/comprobantes/retencion/page.js` — Pagina formulario completa
- [x] Formulario integrado: docs sustento + retenciones multiples con catalogos

### G.5 Guia de Remision
- [x] `src/app/(dashboard)/comprobantes/guia-remision/page.js` — Pagina formulario completa
- [x] Formulario integrado: transportista + multiples destinatarios con items

### G.6 Liquidacion de Compra
- [x] `src/app/(dashboard)/comprobantes/liquidacion/page.js` — Pagina formulario completa
- [x] Formulario integrado: datos proveedor + detalles con IVA

---

## H. RIDE Templates PDF

### H.1 Templates por Tipo
- [x] `RIDENotaCredito.jsx` — Template PDF NC
- [x] `RIDENotaDebito.jsx` — Template PDF ND
- [x] `RIDERetencion.jsx` — Template PDF Retencion
- [x] `RIDEGuiaRemision.jsx` — Template PDF GR
- [x] `RIDELiquidacionCompra.jsx` — Template PDF LC

### H.2 Selector de Template en ride-generator.js
- [x] Switch por tipoComprobante para seleccionar template correcto (`getRIDETemplate()`)
- [x] Mantener compatibilidad con factura (default case)
- [x] Funcion helper `getNombreArchivoRIDE()` para nombres de archivo

---

## I. Integracion IA - Prompts Contextuales

### I.1 Prompts por Tipo de Comprobante
- [ ] `src/lib/ia/comprobante-prompts.js` — System prompts por tipo (04/05/06/07/03)
- [ ] Reglas de negocio por tipo en prompts
- [ ] Sugerencias contextuales (motivos NC, razones ND, codigos retencion, etc.)

### I.2 API Route IA Contextual
- [ ] `src/app/api/ia/comprobante-wizard/route.js` — Chat IA por tipo de comprobante
- [ ] Deteccion automatica de tipo segun contexto

---

## J. Listado Unificado - Extension

### J.1 Filtros por Tipo
- [ ] Agregar filtro por tipo_comprobante en ComprobanteList.jsx
- [ ] Dropdown con todos los tipos (01/03/04/05/06/07)

### J.2 Vista Mixta
- [ ] Mostrar icono/badge por tipo de comprobante
- [ ] Columna tipo en tabla

### J.3 Acciones por Tipo
- [ ] Boton "Nueva Nota de Credito" desde factura autorizada
- [ ] Boton "Nueva Retencion" desde factura autorizada

---

## K. Tests

### K.1 Tests Unitarios XML Builders
- [x] `tests/unit/sri/xml-builder-nc.test.js` — Tests XML Nota de Credito (8 tests)
- [x] `tests/unit/sri/xml-builder-nd.test.js` — Tests XML Nota de Debito (7 tests)
- [x] `tests/unit/sri/xml-builder-ret.test.js` — Tests XML Retencion (8 tests)
- [x] `tests/unit/sri/xml-builder-gr.test.js` — Tests XML Guia Remision (10 tests)
- [x] `tests/unit/sri/xml-builder-lc.test.js` — Tests XML Liquidacion Compra (9 tests)

### K.2 Tests Integracion
- [ ] `tests/integration/comprobantes-adicionales.test.js` — Flujo completo por tipo (opcional)

---

## L. Verificacion Final

- [x] `npm run build` exitoso sin errores
- [ ] `npm test` — Todos los tests pasando
- [x] Factura: XML firmado + enviado al SRI pruebas (estado PPR - En Procesamiento)
- [ ] Nota de Credito: XML valido + autorizacion SRI pruebas
- [ ] Nota de Debito: XML valido + autorizacion SRI pruebas
- [ ] Retencion: XML valido + autorizacion SRI pruebas
- [ ] Guia de Remision: XML valido + autorizacion SRI pruebas
- [ ] Liquidacion de Compra: XML valido + autorizacion SRI pruebas
- [x] Security advisors verificados
- [x] Datos empresa corregidos vs consulta RUC SRI (obligadoContabilidad, regimenRIMPE)
- [ ] Deploy staging exitoso

---

## Resumen Numerico (Estimado)
| Categoria | Cantidad |
|-----------|----------|
| Migraciones BD | 1 (comprobantes_adicionales) |
| Tablas nuevas | 2 (guia_remision_destinatarios, guia_remision_detalles) |
| Tablas modificadas | 2 (comprobantes, retencion_detalles) |
| XML Builders nuevos | 5 funciones |
| Catalogos extendidos | 4 (ret renta, ret IVA, ret ISD, docs sustento) |
| Validadores nuevos | 5 schemas Zod |
| Server Actions nuevas | ~12 funciones |
| Paginas nuevas | 5 (NC, ND, Ret, GR, LC) |
| Componentes UI nuevos | ~10 (formularios + componentes compartidos) |
| Templates RIDE nuevos | 5 |
| Tests nuevos | ~30-50 |
| **Total archivos creados/modificados** | **~35-45** |

---

## Rutas Nuevas de la Aplicacion
```
Nuevas en Fase 4:
/comprobantes/nota-credito         -> Formulario Nota de Credito
/comprobantes/nota-debito          -> Formulario Nota de Debito
/comprobantes/retencion            -> Formulario Retencion
/comprobantes/guia-remision        -> Formulario Guia de Remision
/comprobantes/liquidacion          -> Formulario Liquidacion de Compra
/api/ia/comprobante-wizard         -> Chat IA contextual por tipo

Modificadas en Fase 4:
/comprobantes                      -> Listado con filtro por tipo
/comprobantes/[id]                 -> Detalle extendido para todos los tipos
/api/comprobantes/ride             -> RIDE para todos los tipos
```

---

## Comprobantes Electronicos SRI - Codigos
| Codigo | Tipo | Version XML | Prioridad |
|--------|------|-------------|-----------|
| 01 | Factura | 1.1.0 | ✅ Fase 3 |
| 03 | Liquidacion de Compra | 1.1.0 | BAJA |
| 04 | Nota de Credito | 1.1.0 | **ALTA** |
| 05 | Nota de Debito | 1.0.0 | MEDIA |
| 06 | Guia de Remision | 1.0.0 | MEDIA |
| 07 | Comprobante de Retencion | 2.0.0 | **ALTA** |
