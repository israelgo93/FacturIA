# CHECKLIST FASE 5 — Reportes IA + ATS

## Estado General: COMPLETADO

---

## 1. Migración Base de Datos

- [x] Tabla `compras_recibidas` creada (registro de compras/gastos proveedores)
- [x] Tabla `compras_recibidas_retenciones` creada (retenciones en compras)
- [x] Tabla `empleados` creada (para RDEP)
- [x] Tabla `empleados_ingresos_anuales` creada (ingresos anuales RDEP)
- [x] Extensión `reportes_sri` con campos: `user_id`, `semestre`, `alertas`, `resumen_ia`, `total_registros`
- [x] Índices de rendimiento creados (empresa+periodo, proveedor, compra_id, empresa, anio)
- [x] RLS habilitado en las 4 tablas nuevas (policy `*_tenant`)
- [x] Triggers `updated_at` en tablas editables
- [x] Función `calcular_total_ventas_periodo()` para consultar ventas autorizadas
- [x] Migración aplicada: `reportes_sri_fase5`

## 2. Catálogos ATS + Vencimientos

- [x] Catálogos ATS agregados a `src/lib/utils/sri-catalogs.js`:
  - `TIPO_ID_PROVEEDOR_ATS` (Tabla 2)
  - `TIPO_COMPROBANTE_ATS` (Tabla 4)
  - `COD_SUSTENTO_ATS` (Tabla 5 completa)
  - `FORMA_PAGO_ATS` (Tabla 13)
  - `TIPO_ID_CLIENTE_VENTAS_ATS`
  - Funciones helper: `getLabelTipoIdProveedorATS`, `getLabelCodSustentoATS`, `getLabelFormaPagoATS`
- [x] Módulo de vencimientos: `src/lib/utils/vencimientos.js`
  - `calcularVencimiento()` — por noveno dígito del RUC
  - `diasParaVencimiento()` — días restantes/vencidos
  - `infoVencimiento()` — fecha, días, estado (normal/próximo/urgente/vencido)
  - `getRangoPeriodo()` — rango de fechas mensual o semestral
  - `getPeriodicidadATS()` — mensual vs semestral por régimen

## 3. Validaciones Zod

- [x] `src/lib/validations/compra-recibida.js` — `compraRecibidaSchema`, `retencionCompraSchema`
- [x] `src/lib/validations/empleado.js` — `empleadoSchema`, `ingresosAnualesSchema`

## 4. CRUD Compras Recibidas

- [x] Server Actions: `src/app/(dashboard)/compras/actions.js`
  - `listarCompras()` — con filtros y paginación
  - `crearCompra()` — con retenciones anidadas
  - `actualizarCompra()`
  - `eliminarCompra()`
  - `obtenerCompra()` — con retenciones
- [x] Página: `src/app/(dashboard)/compras/page.js`
  - Listado con GlassTable, búsqueda, paginación
  - Modal de registro con todos los campos ATS
  - Formulario: tipo ID, identificación, razón social, tipo comprobante, código sustento, forma pago, establecimiento, pto emisión, secuencial, fechas, autorización, bases imponibles, IVA, ICE, parte relacionada

## 5. CRUD Empleados

- [x] Server Actions: `src/app/(dashboard)/empleados/actions.js`
  - `listarEmpleados()` — con búsqueda y paginación
  - `crearEmpleado()`
  - `actualizarEmpleado()`
  - `eliminarEmpleado()`
  - `guardarIngresosAnuales()` — upsert por empleado+año
  - `obtenerIngresosAnuales()`
- [x] Página: `src/app/(dashboard)/empleados/page.js`
  - Listado, búsqueda, modal de registro
  - Tipos contrato: Indefinido, Fijo, Eventual, Ocasional

## 6. Motor de Consolidación ATS

- [x] `src/lib/reportes/ats-consolidator.js`
  - `consolidarDatosATS()` — recopila compras, ventas por establecimiento, resumen
  - Excluye compras con retención electrónica asociada
  - Normalización de razón social para XML
  - Soporte mensual y semestral (RIMPE)

## 7. Constructor XML ATS

- [x] `src/lib/reportes/ats-builder.js`
  - `construirXMLATS()` — genera XML compatible con `at.xsd`
  - Módulo compras: codSustento, tpIdProv, idProv, bases, IVA, ICE, retenciones AIR
  - Desglose retenciones IVA por porcentaje (30%, 70%, 100%, etc.)
  - Formas de pago (obligatorio si > $500)
  - Pago exterior
  - Ventas por establecimiento
  - Módulo anulados (estructura preparada)

## 8. Constructor XML RDEP

- [x] `src/lib/reportes/rdep-builder.js`
  - `construirXMLRDEP()` — genera XML compatible con `RDEP.xsd`
  - Períodos de trabajo, ingresos gravados, IESS, gastos personales
  - Sistema salario neto (SI/NO)
  - Escape XML correcto

## 9. Consolidadores de Formularios

- [x] `src/lib/reportes/form104-consolidator.js`
  - `consolidarForm104()` — casilleros del Form 104 IVA
  - Ventas gravadas, tarifa 0%, no objeto, exentas
  - Compras con crédito tributario
  - Liquidación: IVA cobrado neto, crédito tributario, impuesto a pagar / crédito próximo mes
- [x] `src/lib/reportes/form103-consolidator.js`
  - `consolidarForm103()` — agrupación por código de retención
  - Retenciones Renta + Retenciones IVA
  - Combina retenciones de comprobantes electrónicos y compras registradas
  - Total a pagar

## 10. Reporte de Ventas

- [x] `src/lib/reportes/ventas-report.js`
  - `generarReporteVentas()` — detalle y resumen del período
  - Facturas, NC, ND autorizados
  - Ventas brutas, devoluciones, ventas netas, base gravada, IVA

## 11. Exportadores Excel

- [x] Dependencia `xlsx` (SheetJS) instalada
- [x] `src/lib/reportes/excel-exporter.js`
  - `exportarATSExcel()` — hojas Resumen + Compras
  - `exportarForm104Excel()` — casilleros con formato
  - `exportarForm103Excel()` — retenciones renta + IVA + total
  - `exportarVentasExcel()` — detalle + resumen en hojas separadas

## 12. Motor IA

- [x] `src/lib/ia/reportes-prompts.js`
  - `getAnalisisSystemPrompt()` — prompt con datos de empresa + reglas tributarias
  - `ATS_VALIDATOR_PROMPT` — validación ATS con 10 reglas (respuesta JSON)
  - `getChatReportesPrompt()` — prompt contextual con datos fiscales del período
- [x] `src/lib/ia/analisis-tributario.js`
  - `analizarPeriodo()` — detección de anomalías algorítmicas
    - Vencimientos (vencido, urgente, próximo)
    - Consistencia IVA (NC > IVA cobrado)
    - Retenciones faltantes
    - Bancarización (> $500 sin forma de pago)
  - `generarAnalisisIA()` — análisis avanzado con Gemini (fallback automático)

## 13. Server Actions de Reportes

- [x] `src/app/(dashboard)/reportes/actions.js`
  - `generarATS()` — XML + guardar en reportes_sri
  - `generarATSExcel()` — base64 Excel
  - `generarRDEP()` — XML + guardar en reportes_sri
  - `obtenerForm104()` / `exportarForm104()`
  - `obtenerForm103()` / `exportarForm103Xlsx()`
  - `obtenerReporteVentas()` / `exportarVentasXlsx()`
  - `obtenerContextoEmpresa()` — para chat IA

## 14. Chat IA Reportes

- [x] API route streaming: `src/app/api/reportes/chat/route.js`
  - Vercel AI SDK + Gemini 3 Flash con thinkingLevel: 'low'
  - Contexto fiscal del período (ventas, compras, IVA, retenciones)
  - System prompt especializado en tributación ecuatoriana
- [x] Dependencia `@ai-sdk/react` instalada para `useChat`

## 15. Páginas UI

- [x] Hub de reportes actualizado: `src/app/(dashboard)/reportes/page.js`
  - 6 cards con iconos de colores y links funcionales
  - ATS, RDEP, Form 104, Form 103, Ventas, Análisis IA
- [x] ATS: `src/app/(dashboard)/reportes/ats/page.js`
  - Selector período, generar XML, descargar XML/Excel, resumen con métricas
- [x] RDEP: `src/app/(dashboard)/reportes/rdep/page.js`
  - Selector año, generar XML, previsualización, descargar
- [x] Form 104 IVA: `src/app/(dashboard)/reportes/iva/page.js`
  - Casilleros con formato (número + label + valor), liquidación con colores, exportar Excel
- [x] Form 103 Retenciones: `src/app/(dashboard)/reportes/retenciones/page.js`
  - Tablas de retenciones Renta e IVA, total a pagar, exportar Excel
- [x] Ventas: `src/app/(dashboard)/reportes/ventas/page.js`
  - Cards resumen, tabla detalle, exportar Excel
- [x] Análisis IA: `src/app/(dashboard)/reportes/analisis/page.js`
  - Chat streaming con Gemini, selector período, contexto fiscal automático

## 16. Componente Reutilizable

- [x] `src/components/reportes/PeriodoSelector.jsx`
  - Selector de año + mes (o semestre)
  - Catálogos: MESES, SEMESTRES, ANIOS (últimos 5 años)

## 17. Navegación

- [x] Sidebar actualizado con entradas: Compras, Empleados
- [x] MobileMenu actualizado con las mismas entradas

## 18. Build

- [x] `npm run build` exitoso — 0 errores, 41 rutas generadas
- [x] Todas las nuevas rutas visibles en el output del build:
  - `/compras`, `/empleados`
  - `/reportes`, `/reportes/ats`, `/reportes/rdep`, `/reportes/iva`, `/reportes/retenciones`, `/reportes/ventas`, `/reportes/analisis`
  - `/api/reportes/chat`

---

## Archivos Creados/Modificados (Fase 5)

### Nuevos (21 archivos)

| Archivo | Propósito |
|---------|-----------|
| `src/lib/utils/vencimientos.js` | Cálculo vencimientos tributarios |
| `src/lib/validations/compra-recibida.js` | Schema Zod compras |
| `src/lib/validations/empleado.js` | Schema Zod empleados |
| `src/app/(dashboard)/compras/actions.js` | Server Actions compras |
| `src/app/(dashboard)/compras/page.js` | UI compras recibidas |
| `src/app/(dashboard)/empleados/actions.js` | Server Actions empleados |
| `src/app/(dashboard)/empleados/page.js` | UI empleados |
| `src/lib/reportes/ats-consolidator.js` | Consolidación datos ATS |
| `src/lib/reportes/ats-builder.js` | Generador XML ATS |
| `src/lib/reportes/rdep-builder.js` | Generador XML RDEP |
| `src/lib/reportes/form104-consolidator.js` | Pre-llenado Form 104 |
| `src/lib/reportes/form103-consolidator.js` | Pre-llenado Form 103 |
| `src/lib/reportes/ventas-report.js` | Reporte de ventas |
| `src/lib/reportes/excel-exporter.js` | Exportación Excel |
| `src/lib/ia/reportes-prompts.js` | Prompts IA tributarios |
| `src/lib/ia/analisis-tributario.js` | Motor análisis IA |
| `src/app/(dashboard)/reportes/actions.js` | Server Actions reportes |
| `src/app/api/reportes/chat/route.js` | API chat IA streaming |
| `src/components/reportes/PeriodoSelector.jsx` | Selector período |
| `src/app/(dashboard)/reportes/ats/page.js` | Página ATS |
| `src/app/(dashboard)/reportes/rdep/page.js` | Página RDEP |
| `src/app/(dashboard)/reportes/iva/page.js` | Página Form 104 |
| `src/app/(dashboard)/reportes/retenciones/page.js` | Página Form 103 |
| `src/app/(dashboard)/reportes/ventas/page.js` | Página ventas |
| `src/app/(dashboard)/reportes/analisis/page.js` | Chat IA reportes |

### Modificados (3 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/lib/utils/sri-catalogs.js` | +catálogos ATS (Tablas 2,4,5,13) + helpers |
| `src/components/layout/Sidebar.jsx` | +Compras, +Empleados en navegación |
| `src/components/layout/MobileMenu.jsx` | +Compras, +Empleados en navegación |
| `src/app/(dashboard)/reportes/page.js` | Hub actualizado con links funcionales |

### Dependencias Agregadas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `xlsx` | latest | Exportación Excel (SheetJS) |
| `@ai-sdk/react` | latest | Hook useChat para streaming |

### Migración BD

| Migración | Objetos |
|-----------|---------|
| `reportes_sri_fase5` | 4 tablas, 5 columnas ALTER, 5 índices, 4 políticas RLS, 3 triggers, 1 función |
