# PLAN DE VERIFICACIÓN Y TESTING — facturIA SaaS
## Validación End-to-End: Fases 3, 4 y 5 contra Ambiente SRI Pruebas

**Fecha:** 9 de febrero de 2026  
**Proyecto:** facturIA — Plataforma de Facturación Electrónica Ecuador  
**Alcance:** Verificación de interfaz, comprobantes electrónicos (01-07), reportes tributarios (ATS/RDEP), tests unitarios, seguridad  
**Ambiente:** SRI Pruebas (Código 1)  
**Receptor pruebas:** "PRUEBAS SERVICIO DE RENTAS INTERNAS" (Tabla 5 Ficha Técnica)

---

## ESTADO ACTUAL — Línea Base

| Componente | Estado Código | Probado con SRI | Pendiente |
|:--|:--:|:--:|:--|
| Factura (01) | ✅ Completo | ✅ AUTORIZADO | Ninguno |
| Liquidación de Compra (03) | ✅ Completo | ⏳ Sin probar | Testing SRI |
| Nota de Crédito (04) | ✅ Completo | ⏳ Sin probar | Testing SRI |
| Nota de Débito (05) | ✅ Completo | ⏳ Sin probar | Testing SRI |
| Guía de Remisión (06) | ✅ Completo | ⏳ Sin probar | Testing SRI |
| Comprobante de Retención (07) | ✅ Completo | ⏳ Sin probar | Testing SRI |
| ATS XML/Excel | ✅ Completo | ⏳ 0 reportes | Generación real |
| RDEP XML | ✅ Completo | ⏳ 0 empleados | Registrar datos + generar |
| Form 104/103 | ✅ Completo | ⏳ Sin probar | Generación real |
| Tests unitarios (42) | ✅ Planificados | ❌ Sin ejecutar | Ejecución completa |
| Seguridad BD | ⚠️ 2 warnings | — | Corrección |

---

## PREREQUISITOS ANTES DE COMENZAR

Antes de ejecutar cualquier paso del plan, verificar que estos componentes fundamentales estén operativos:

**P1. Certificado Digital .p12**
- Confirmar que el archivo .p12 está accesible en Supabase Storage bucket `certificados`
- Ejecutar query: `SELECT id, nombre_archivo, estado FROM certificados WHERE empresa_id = '<TU_EMPRESA_ID>' AND estado = 'activo'`
- Probar descarga y parseo del .p12 con la contraseña almacenada (AES-256)
- Si falla: este es un bloqueante crítico — resolver antes de continuar

**P2. Empresa Configurada en Ambiente Pruebas**
- Confirmar que la empresa tiene `ambiente = '1'` (pruebas)
- Verificar RUC válido registrado en SRI
- Confirmar al menos 1 establecimiento y 1 punto de emisión activos
- Query: `SELECT ruc, razon_social, ambiente FROM empresas WHERE user_id = auth.uid()`

**P3. Conectividad con Web Services SRI**
- Test de conexión a WS Recepción: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl`
- Test de conexión a WS Autorización: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl`
- Verificar que no hay bloqueos de firewall o certificados SSL

**P4. Datos Base Mínimos**
- Al menos 1 cliente registrado con RUC o cédula válida
- Al menos 3 productos con diferentes tarifas IVA (0%, 5%, 15%)
- Al menos 1 factura en estado AUTORIZADO (necesaria como documento sustento para NC, ND, Retención)

---

## FASE A — VERIFICACIÓN DE INTERFAZ UI (Día 1)

### A.1 Navegación General

| # | Verificación | Ruta | Criterio de Aceptación |
|:--:|:--|:--|:--|
| A.1.1 | Dashboard principal carga sin errores | `/(dashboard)` | Sin errores en consola, KPIs visibles |
| A.1.2 | Menú lateral muestra todas las opciones F4/F5 | Sidebar | Links a: Comprobantes, Clientes, Productos, Compras, Empleados, Reportes |
| A.1.3 | Listado de comprobantes funciona | `/comprobantes` | GlassTable carga, filtros por tipo y estado operativos |
| A.1.4 | Tema claro/oscuro funciona | Topbar toggle | Glassmorphism se adapta correctamente en ambos temas |

### A.2 Formularios de Comprobantes — Renderizado

Verificar que cada formulario carga correctamente, sin errores JS, con todos sus campos:

| # | Formulario | Ruta | Campos Clave a Verificar |
|:--:|:--|:--|:--|
| A.2.1 | Nueva Factura | `/comprobantes/nuevo` | Wizard 5 pasos, selector cliente, agregar productos, cálculo IVA, totales |
| A.2.2 | Nota de Crédito | `/comprobantes/nota-credito` | Componente `SeleccionarDocumentoSustento`, autocarga datos de factura original, campo motivo obligatorio |
| A.2.3 | Nota de Débito | `/comprobantes/nota-debito` | Selector doc sustento, sección de motivos dinámicos (razón + valor), cálculo impuestos por motivo |
| A.2.4 | Retención | `/comprobantes/retencion` | Selector doc sustento, agregar retenciones (Renta/IVA/ISD), códigos de retención, periodo fiscal mm/aaaa |
| A.2.5 | Guía de Remisión | `/comprobantes/guia-remision` | Datos transportista, placa vehículo, fechas transporte, múltiples destinatarios con ítems |
| A.2.6 | Liquidación de Compra | `/comprobantes/liquidacion-compra` | Datos proveedor (ID, razón social, dirección), detalles productos/servicios, cálculo impuestos |

### A.3 Pantallas de Reportes — Renderizado

| # | Pantalla | Ruta | Verificar |
|:--:|:--|:--|:--|
| A.3.1 | Hub de reportes | `/reportes` | Cards para ATS, RDEP, Form 104, Form 103, Ventas, Análisis IA |
| A.3.2 | Generador ATS | `/reportes/ats` | PeriodoSelector (mes/semestre), botón generar, descarga XML/Excel |
| A.3.3 | Generador RDEP | `/reportes/rdep` | Selector año fiscal, listado empleados, botón generar XML |
| A.3.4 | Form 104 IVA | `/reportes/form104` | Casilleros pre-llenados, totales calculados |
| A.3.5 | Form 103 Retenciones | `/reportes/form103` | Casilleros pre-llenados por código retención |
| A.3.6 | Compras recibidas | `/compras` | GlassTable, formulario registro compra, campos ATS |
| A.3.7 | Empleados | `/empleados` | GlassTable, formulario registro empleado, ingresos anuales |

**Criterio de éxito Fase A:** Todas las pantallas cargan sin errores 500 ni excepciones JS. Los formularios muestran todos los campos esperados con validaciones Zod activas.

---

## FASE B — CREAR FACTURA NUEVA (01) — Validación de Flujo Base (Día 1-2)

Aunque la factura ya fue probada previamente, esta prueba confirma que el flujo completo sigue funcional y genera datos sustento necesarios para los comprobantes posteriores.

### B.1 Datos de la Factura de Prueba

```
Receptor:         PRUEBAS SERVICIO DE RENTAS INTERNAS
Tipo ID:          04 (RUC)  
Identificación:   Usar RUC válido de pruebas
Fecha emisión:    Fecha actual (dd/mm/aaaa)
Ambiente:         1 (Pruebas)

Detalle:
┌─────┬──────────────────────────┬──────┬──────────┬─────────┬──────────┐
│ Qty │ Descripción              │ P.U. │ Subtotal │ IVA Cód │ IVA Vlr  │
├─────┼──────────────────────────┼──────┼──────────┼─────────┼──────────┤
│  2  │ Servicio consultoría     │50.00 │  100.00  │   4(15%)│  15.00   │
│  5  │ Producto agrícola        │10.00 │   50.00  │   0(0%) │   0.00   │
│  1  │ Servicio técnico         │25.00 │   25.00  │   5(5%) │   1.25   │
└─────┴──────────────────────────┴──────┴──────────┴─────────┴──────────┘
Subtotal 15%:    100.00
Subtotal 0%:      50.00
Subtotal 5%:      25.00
IVA 15%:          15.00
IVA 5%:            1.25
TOTAL:           191.25
Forma de pago:   01 (SIN UTILIZACIÓN DEL SISTEMA FINANCIERO)
```

### B.2 Flujo de Validación Paso a Paso

| # | Paso | Acción | Verificación |
|:--:|:--|:--|:--|
| B.2.1 | Ingresar datos | Llenar wizard paso a paso | Validaciones Zod activas, cálculos automáticos correctos |
| B.2.2 | Guardar borrador | Click "Guardar" | Estado = `CREADO` en BD, registro en tabla `comprobantes` |
| B.2.3 | Procesar comprobante | Click "Firmar y Enviar" | Orquestador ejecuta: XML → Firma XAdES → Envío SOAP |
| B.2.4 | Verificar clave acceso | Consultar BD | 49 dígitos, dígito verificador Módulo 11 correcto |
| B.2.5 | Verificar XML generado | Inspeccionar `xml_firmado` | Estructura factura v1.1.0/v2.1.0, datos correctos, firma XAdES-BES presente |
| B.2.6 | Verificar recepción SRI | Consultar `sri_log` | Estado RECIBIDA del WS Recepción |
| B.2.7 | Verificar autorización | Consultar estado | Estado = `AUTORIZADO` (AUT), número autorización = clave acceso |
| B.2.8 | Generar RIDE PDF | Abrir `/comprobantes/[id]/ride` | PDF renderiza correctamente con todos los datos |
| B.2.9 | Detalle comprobante | Abrir `/comprobantes/[id]` | Muestra estado, XML, botones re-envío email |

**Query de verificación:**
```sql
SELECT id, tipo_comprobante, clave_acceso, estado, numero_autorizacion, 
       total, fecha_emision, fecha_autorizacion
FROM comprobantes 
WHERE tipo_comprobante = '01' AND estado = 'AUTORIZADO'
ORDER BY created_at DESC LIMIT 1;
```

**Criterio de éxito:** Factura llega a estado AUTORIZADO. RIDE PDF se genera. Log SRI registra toda la comunicación.

---

## FASE C — COMPROBANTES TIPOS 03-07 CONTRA SRI PRUEBAS (Días 2-4)

Esta es la fase más extensa. Cada comprobante sigue el mismo flujo del orquestador pero con datos específicos según su tipo. El orden de ejecución importa porque algunos comprobantes dependen de la factura autorizada como documento sustento.

### C.1 Nota de Crédito (Código 04) — Día 2

**Prerequisito:** Factura AUTORIZADA de la Fase B

**Datos de prueba:**

```
Documento sustento:  Factura autorizada (Fase B)
Motivo:             "Devolución parcial de mercadería - Producto agrícola"
Tipo:               Anulación PARCIAL

Detalle (del producto devuelto):
┌─────┬──────────────────────────┬──────┬──────────┬─────────┬──────────┐
│ Qty │ Descripción              │ P.U. │ Subtotal │ IVA Cód │ IVA Vlr  │
├─────┼──────────────────────────┼──────┼──────────┼─────────┼──────────┤
│  3  │ Producto agrícola        │10.00 │   30.00  │   0(0%) │   0.00   │
└─────┴──────────────────────────┴──────┴──────────┴─────────┴──────────┘
Subtotal:    30.00
IVA:          0.00
TOTAL:       30.00
```

**Validaciones específicas NC:**

| # | Verificación | Criterio |
|:--:|:--|:--|
| C.1.1 | Selector carga facturas autorizadas | Solo muestra facturas con estado AUT |
| C.1.2 | Autocarga datos del doc sustento | Receptor, fecha, detalles se llenan automáticamente |
| C.1.3 | Total NC ≤ total factura original | Validación que no supere $191.25 |
| C.1.4 | Tarifa IVA tomada del doc sustento | IVA se hereda de la factura original, NO de la fecha de la NC |
| C.1.5 | XML genera `notaCredito` v1.1.0 | Tag raíz correcto, codDoc='04' |
| C.1.6 | Clave acceso con tipo doc 04 | Posiciones [9-10] = '04' |
| C.1.7 | Firma XAdES-BES aplicada | Firma digital presente en el XML |
| C.1.8 | SRI autoriza comprobante | Estado AUTORIZADO |
| C.1.9 | RIDE PDF de NC genera correctamente | Template específico NC con referencia al doc sustento |

### C.2 Nota de Débito (Código 05) — Día 2

**Prerequisito:** Factura AUTORIZADA de la Fase B

**Datos de prueba:**

```
Documento sustento:  Factura autorizada (Fase B)

Motivos:
┌──────────────────────────────────────┬──────────┐
│ Razón                                │ Valor    │
├──────────────────────────────────────┼──────────┤
│ Intereses por mora en pago           │   15.00  │
│ Diferencia en precio por ajuste      │   10.00  │
└──────────────────────────────────────┴──────────┘
Subtotal 15%:    25.00
IVA 15%:          3.75
TOTAL:           28.75
```

**Validaciones específicas ND:**

| # | Verificación | Criterio |
|:--:|:--|:--|
| C.2.1 | Formulario tiene sección "motivos" dinámica | Agregar/eliminar motivos funciona |
| C.2.2 | No tiene detalles de productos | Solo motivos con razón + valor |
| C.2.3 | Cálculo impuestos por motivo | Cada motivo calcula su IVA |
| C.2.4 | XML genera `notaDebito` v1.0.0 | codDoc='05', estructura motivos correcta |
| C.2.5 | SRI autoriza comprobante | Estado AUTORIZADO |
| C.2.6 | RIDE PDF de ND genera correctamente | Template específico ND |

### C.3 Comprobante de Retención (Código 07) — Día 3

**Prerequisito:** Factura AUTORIZADA como doc sustento (puede ser la de Fase B o crear una simulando compra recibida)

**Datos de prueba:**

```
Sujeto retenido:     PRUEBAS SERVICIO DE RENTAS INTERNAS
Tipo ID:             04 (RUC)
Periodo fiscal:      02/2026 (mm/aaaa)
Documento sustento:  01 - Factura
Fecha doc sustento:  Fecha de la factura autorizada

Retenciones aplicadas:
┌──────────┬────────┬──────────────────────────────┬──────────┬─────────┬──────────┐
│ Tipo     │ Código │ Descripción                  │ Base Imp │ %       │ Vlr Ret  │
├──────────┼────────┼──────────────────────────────┼──────────┼─────────┼──────────┤
│ Renta(1) │  303   │ Honorarios profesionales 10% │  100.00  │  10.00  │  10.00   │
│ Renta(1) │  312   │ Bienes muebles 1.75%         │   50.00  │   1.75  │   0.88   │
│ IVA(2)   │    3   │ Retención IVA 30%            │   15.00  │  30.00  │   4.50   │
└──────────┴────────┴──────────────────────────────┴──────────┴─────────┴──────────┘
Total retenido:  15.38
```

**Validaciones específicas Retención:**

| # | Verificación | Criterio |
|:--:|:--|:--|
| C.3.1 | Formulario permite múltiples retenciones | Agregar Renta + IVA + ISD dinámicamente |
| C.3.2 | Códigos retención cargan del catálogo | CODIGOS_RETENCION_RENTA, _IVA, _ISD desde sri-catalogs.js |
| C.3.3 | Periodo fiscal formato mm/aaaa | Validación de formato |
| C.3.4 | Puede agrupar múltiples doc sustento | Un comprobante referencia varias facturas |
| C.3.5 | XML genera `comprobanteRetencion` v2.0.0 | codDoc='07', estructura impuestos correcta |
| C.3.6 | SRI autoriza comprobante | Estado AUTORIZADO |
| C.3.7 | Emisión dentro de 5 días hábiles | Advertencia si excede plazo |
| C.3.8 | RIDE PDF de Retención genera correctamente | Template específico con tabla de retenciones |

### C.4 Guía de Remisión (Código 06) — Día 3

**Datos de prueba:**

```
Dirección partida:       Av. 9 de Octubre 100, Guayaquil
Transportista RUC:       Usar RUC válido de prueba
Razón social transport.: Transportes Prueba S.A.
Placa vehículo:          GYE-1234
Fecha inicio transporte: Fecha actual
Fecha fin transporte:    Fecha actual + 1 día
Motivo traslado:         Venta de mercadería

Destinatario 1:
┌──────────────────────────────┬──────────────────────────────────────┐
│ Campo                        │ Valor                                │
├──────────────────────────────┼──────────────────────────────────────┤
│ Identificación               │ RUC del receptor                     │
│ Razón social                 │ PRUEBAS SERVICIO DE RENTAS INTERNAS  │
│ Dirección destino            │ Av. Amazonas 123, Quito              │
│ Motivo traslado              │ Venta                                │
│ Doc sustento (opcional)      │ Factura autorizada Fase B            │
│ Ítems: Producto agrícola x5  │ Cantidad: 5                          │
└──────────────────────────────┴──────────────────────────────────────┘
```

**Validaciones específicas Guía de Remisión:**

| # | Verificación | Criterio |
|:--:|:--|:--|
| C.4.1 | Formulario con datos de transportista | RUC transportista, razón social, placa obligatorios |
| C.4.2 | Fechas transporte obligatorias | Inicio ≤ Fin, formato válido |
| C.4.3 | Múltiples destinatarios | Agregar/eliminar destinatarios dinámicamente |
| C.4.4 | Sin valores monetarios | No hay cálculo de subtotales ni IVA |
| C.4.5 | XML genera `guiaRemision` v1.0.0 | codDoc='06', estructura destinatarios correcta |
| C.4.6 | SRI autoriza comprobante | Estado AUTORIZADO |
| C.4.7 | RIDE PDF de Guía genera correctamente | Template específico con ruta y destinatarios |

### C.5 Liquidación de Compra (Código 03) — Día 4

**Datos de prueba:**

```
Proveedor (no obligado a facturar):
  Tipo ID:             05 (Cédula)
  Identificación:      Usar cédula válida de prueba
  Razón social:        Juan Pérez Campesino
  Dirección:           Recinto Rural, Guayas

Detalle:
┌─────┬──────────────────────────┬──────┬──────────┬─────────┬──────────┐
│ Qty │ Descripción              │ P.U. │ Subtotal │ IVA Cód │ IVA Vlr  │
├─────┼──────────────────────────┼──────┼──────────┼─────────┼──────────┤
│ 100 │ Cacao en grano (kg)      │ 2.50 │  250.00  │   0(0%) │   0.00   │
│  50 │ Banano orgánico (racimo) │ 1.00 │   50.00  │   0(0%) │   0.00   │
└─────┴──────────────────────────┴──────┴──────────┴─────────┴──────────┘
Subtotal 0%:    300.00
IVA:              0.00
TOTAL:          300.00
Forma de pago:  01 (SIN UTILIZACIÓN DEL SISTEMA FINANCIERO)
```

**Validaciones específicas Liquidación de Compra:**

| # | Verificación | Criterio |
|:--:|:--|:--|
| C.5.1 | Formulario con datos del proveedor | ID, razón social, dirección del proveedor (no del comprador) |
| C.5.2 | No permite tipo ID "consumidor final" (07) | Validación que excluye código 07 |
| C.5.3 | Estructura similar a factura | Detalles con productos, impuestos, totales |
| C.5.4 | El emisor es la empresa (comprador) | La empresa emite el comprobante, no el proveedor |
| C.5.5 | XML genera `liquidacionCompra` v1.1.0 | codDoc='03', datos proveedor en lugar de comprador |
| C.5.6 | SRI autoriza comprobante | Estado AUTORIZADO |
| C.5.7 | RIDE PDF de Liquidación genera correctamente | Template específico con datos proveedor |

### C.6 Verificación Cruzada Post-Comprobantes

Una vez autorizados todos los comprobantes, ejecutar estas verificaciones de integridad:

```sql
-- Verificar que existen los 6 tipos autorizados
SELECT tipo_comprobante, COUNT(*) as cantidad, 
       MIN(fecha_autorizacion) as primera_aut,
       MAX(fecha_autorizacion) as ultima_aut
FROM comprobantes 
WHERE estado = 'AUTORIZADO'
GROUP BY tipo_comprobante
ORDER BY tipo_comprobante;

-- Resultado esperado:
-- 01 | ≥1 | Factura
-- 03 | ≥1 | Liquidación de Compra
-- 04 | ≥1 | Nota de Crédito
-- 05 | ≥1 | Nota de Débito
-- 06 | ≥1 | Guía de Remisión
-- 07 | ≥1 | Comprobante de Retención

-- Verificar logs SRI completos
SELECT comprobante_id, tipo_operacion, estado_respuesta, created_at
FROM sri_log
ORDER BY created_at DESC LIMIT 20;

-- Verificar secuenciales incrementales
SELECT tipo_comprobante, siguiente
FROM secuenciales
WHERE empresa_id = '<TU_EMPRESA_ID>'
ORDER BY tipo_comprobante;
```

**Criterio de éxito Fase C:** Los 5 tipos de comprobantes adicionales (03, 04, 05, 06, 07) alcanzan estado AUTORIZADO en el ambiente de pruebas SRI. Todos los RIDE PDF se generan correctamente. Todos los logs SRI registran la comunicación completa.

---

## FASE D — DATOS PARA REPORTES: COMPRAS Y EMPLEADOS (Día 5)

### D.1 Registrar Compras Recibidas (para ATS)

Necesitamos al menos 3 compras recibidas con diferentes configuraciones para que el ATS tenga datos representativos:

**Compra 1 — Proveedor Sociedad (con retención electrónica):**

```
Proveedor RUC:          1790012345001
Razón social:           Empresa Proveedora S.A.
Tipo comprobante:       01 (Factura)
Código sustento:        01 (Crédito tributario IVA)
Fecha:                  01/02/2026
Base imponible IVA 15%: 500.00
IVA:                    75.00
Total:                  575.00
Forma de pago:          20 (Otros con sistema financiero)
Retención electrónica:  SÍ (esta compra NO se reporta en ATS por tener retención electrónica)
```

**Compra 2 — Proveedor Persona Natural (sin retención electrónica):**

```
Proveedor cédula:       0901234567
Razón social:           María López Servicios
Tipo comprobante:       01 (Factura)
Código sustento:        01 (Crédito tributario IVA)
Fecha:                  05/02/2026
Base imponible IVA 15%: 200.00
Base imponible 0%:      100.00
IVA:                    30.00
Total:                  330.00
Forma de pago:          01 (Sin sistema financiero)
Retención electrónica:  NO (esta SÍ se reporta en ATS)
```

**Compra 3 — Compra con Nota de Venta RISE:**

```
Proveedor RUC:          0912345678001
Razón social:           Tienda RISE Ejemplo
Tipo comprobante:       02 (Nota de Venta RISE)
Código sustento:        00 (Sin crédito tributario)
Fecha:                  08/02/2026
Base imponible 0%:      80.00
IVA:                    0.00
Total:                  80.00
Forma de pago:          01 (Sin sistema financiero)
```

**Verificaciones D.1:**

| # | Verificación | Query/Acción |
|:--:|:--|:--|
| D.1.1 | Formulario compra carga campos ATS | Tipo ID proveedor, código sustento, forma pago, bases imponibles |
| D.1.2 | Compras registradas en BD | `SELECT COUNT(*) FROM compras_recibidas WHERE empresa_id = '...'` → ≥3 |
| D.1.3 | Retenciones de compra registradas | `SELECT * FROM compras_recibidas_retenciones` para compras que apliquen |
| D.1.4 | Listado compras funciona | GlassTable en `/compras` muestra las 3 compras |

### D.2 Registrar Empleado (para RDEP)

**Empleado de prueba:**

```
Tipo contrato:          Indefinido
Cédula:                 0901234568 (cédula válida de prueba)
Apellido/Nombre:        Prueba García Carlos
Fecha inicio:           01/01/2026
Estado:                 Activo

Ingresos anuales 2026:
┌──────────────────────────────────┬──────────────┐
│ Concepto                         │ Valor Anual  │
├──────────────────────────────────┼──────────────┤
│ Sueldo/salario                   │   6,000.00   │
│ Décimo tercer sueldo             │     500.00   │
│ Décimo cuarto sueldo             │     460.00   │
│ Fondos de reserva                │     500.00   │
│ Aporte personal IESS (9.45%)     │     567.00   │
│ Impuesto renta retenido          │       0.00   │
└──────────────────────────────────┴──────────────┘
```

**Verificaciones D.2:**

| # | Verificación | Query/Acción |
|:--:|:--|:--|
| D.2.1 | Formulario empleado carga correctamente | `/empleados` → Nuevo empleado |
| D.2.2 | Tipos contrato disponibles | Indefinido, fijo, eventual, ocasional |
| D.2.3 | Empleado registrado en BD | `SELECT * FROM empleados WHERE empresa_id = '...'` → ≥1 |
| D.2.4 | Ingresos anuales registrados | `SELECT * FROM empleados_ingresos_anuales` → Registro para 2026 |

---

## FASE E — GENERACIÓN Y VALIDACIÓN DE REPORTES ATS/RDEP (Días 5-6)

### E.1 Generar ATS Mensual — Febrero 2026

| # | Paso | Acción | Verificación |
|:--:|:--|:--|:--|
| E.1.1 | Abrir generador ATS | `/reportes/ats` | Formulario con PeriodoSelector |
| E.1.2 | Seleccionar periodo | Febrero 2026 (mensual) | Selector funciona |
| E.1.3 | Generar ATS | Click "Generar" | Spinner de procesamiento visible |
| E.1.4 | Verificar consolidación | Inspeccionar datos | Ventas del periodo + compras recibidas (excepto las que tienen retención electrónica) |
| E.1.5 | Descargar XML ATS | Click descarga | Archivo XML generado |
| E.1.6 | Validar XML contra esquema at.xsd | Comparar estructura | Encoding ISO-8859-1, tags ATS correctos |
| E.1.7 | Descargar Excel ATS | Click descarga Excel | Archivo .xlsx con datos tabulados |
| E.1.8 | Registro en BD | Query `reportes_sri` | Nuevo registro tipo 'ATS', periodo '2026-02' |

**Validaciones del XML ATS generado:**

```xml
<!-- Estructura esperada del XML ATS -->
<?xml version="1.0" encoding="ISO-8859-1"?>
<iva>
  <TipoIDInformante>R</TipoIDInformante>
  <IdInformante>[RUC empresa]</IdInformante>
  <razonSocial>[Razón social empresa]</razonSocial>
  <Anio>2026</Anio>
  <Mes>02</Mes>
  
  <!-- Compras (solo las SIN retención electrónica) -->
  <compras>
    <detalleCompras>...</detalleCompras>
  </compras>
  
  <!-- Ventas por establecimiento -->
  <ventas>
    <detalleVentas>
      <tpIdCliente>[04/05/06/07]</tpIdCliente>
      <idCliente>[RUC/Cédula]</idCliente>
      ...
    </detalleVentas>
  </ventas>
</iva>
```

**Regla crítica ATS:** Las facturas electrónicas autorizadas por el SRI que ya tienen retención electrónica NO deben aparecer en el módulo de compras del ATS (Resolución NAC-DGERCGC16-00000092).

### E.2 Generar RDEP — Año 2026

| # | Paso | Acción | Verificación |
|:--:|:--|:--|:--|
| E.2.1 | Abrir generador RDEP | `/reportes/rdep` | Formulario con selector de año |
| E.2.2 | Seleccionar año 2026 | Selector de año | Funciona |
| E.2.3 | Verificar empleados listados | Vista previa | Muestra al empleado registrado en D.2 |
| E.2.4 | Generar RDEP | Click "Generar" | Procesamiento |
| E.2.5 | Descargar XML RDEP | Click descarga | Archivo XML generado |
| E.2.6 | Validar XML contra esquema RDEP.xsd | Comparar estructura | Tags RDEP correctos |
| E.2.7 | Registro en BD | Query `reportes_sri` | Nuevo registro tipo 'RDEP', año '2026' |

**Estructura esperada XML RDEP:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdep>
  <anioFiscal>2026</anioFiscal>
  <rucDeclarante>[RUC empresa]</rucDeclarante>
  <empleados>
    <empleado>
      <tipoIdentificacion>C</tipoIdentificacion>
      <identificacion>0901234568</identificacion>
      <apellidoNombre>PRUEBA GARCIA CARLOS</apellidoNombre>
      <sueldoSalario>6000.00</sueldoSalario>
      <decimoTercer>500.00</decimoTercer>
      <decimoCuarto>460.00</decimoCuarto>
      <fondoReserva>500.00</fondoReserva>
      <aportePersonalIESS>567.00</aportePersonalIESS>
      <impuestoRentaCausado>0.00</impuestoRentaCausado>
      ...
    </empleado>
  </empleados>
</rdep>
```

### E.3 Generar Pre-llenado Form 104 (IVA)

| # | Verificación | Criterio |
|:--:|:--|:--|
| E.3.1 | Casillero ventas tarifa 15% | Muestra subtotal de ventas con IVA 15% del periodo |
| E.3.2 | Casillero ventas tarifa 0% | Muestra subtotal de ventas con IVA 0% |
| E.3.3 | Casillero IVA cobrado en ventas | Total IVA de las facturas autorizadas |
| E.3.4 | Casillero crédito tributario compras | IVA de compras recibidas con código sustento 01 |
| E.3.5 | Cálculo impuesto a pagar | IVA cobrado - crédito tributario |
| E.3.6 | Exportar Excel | Descarga .xlsx con casilleros pre-llenados |

### E.4 Generar Pre-llenado Form 103 (Retenciones)

| # | Verificación | Criterio |
|:--:|:--|:--|
| E.4.1 | Casilleros por código de retención | Base imponible + valor retenido por cada código usado |
| E.4.2 | Retenciones renta agrupadas | Códigos 303, 312, etc. con sus bases y valores |
| E.4.3 | Retenciones IVA agrupadas | Códigos 3, 5, 6 con sus bases y valores |
| E.4.4 | Total retenido calculado | Suma de todas las retenciones del periodo |
| E.4.5 | Exportar Excel | Descarga .xlsx con casilleros pre-llenados |

### E.5 Verificación del Chat IA Reportes

| # | Paso | Acción | Verificación |
|:--:|:--|:--|:--|
| E.5.1 | Abrir chat IA | `/reportes` → Análisis IA | Interfaz de chat carga |
| E.5.2 | Consulta simple | "¿Cuánto vendí este mes?" | Respuesta con datos reales de comprobantes autorizados |
| E.5.3 | Consulta compleja | "¿Cuáles son mis obligaciones tributarias para febrero?" | Respuesta con vencimientos según noveno dígito RUC |
| E.5.4 | Streaming funciona | Observar respuesta | Texto aparece progresivamente (Vercel AI SDK streaming) |

**Criterio de éxito Fase E:** ATS y RDEP generan XML válido. Los XML tienen la estructura correcta según los esquemas at.xsd y RDEP.xsd. Los formularios 104 y 103 muestran datos coherentes con los comprobantes y compras registradas. Registro en tabla `reportes_sri` para cada reporte generado.

---

## FASE F — TESTS UNITARIOS (Día 7)

### F.1 Suite de 42 Tests Planificados — XML Builders

Los 42 tests están distribuidos entre los 6 XML Builders (7 tests promedio por tipo):

| Grupo | Archivo Fuente | Tests | Descripción |
|:--|:--|:--:|:--|
| Factura (01) | `xml-builder.js` → buildFactura | 7 | Estructura XML, campos obligatorios, cálculo impuestos, decimales, clave acceso |
| Liquidación (03) | `xml-builder.js` → buildLiquidacion | 7 | Datos proveedor, codDoc='03', estructura detalles |
| Nota Crédito (04) | `xml-builder.js` → buildNotaCredito | 7 | Referencia doc sustento, motivo, IVA heredado |
| Nota Débito (05) | `xml-builder.js` → buildNotaDebito | 7 | Estructura motivos (sin detalles productos), cálculo por motivo |
| Guía Remisión (06) | `xml-builder.js` → buildGuiaRemision | 7 | Sin valores monetarios, múltiples destinatarios, datos transporte |
| Retención (07) | `xml-builder.js` → buildRetencion | 7 | Múltiples retenciones, tipos impuesto, periodo fiscal, v2.0.0 |

### F.2 Categorías de Tests por Builder

Cada builder debe cubrir estas 7 categorías:

| # | Categoría | Qué Verifica |
|:--:|:--|:--|
| 1 | Estructura XML válida | Tag raíz correcto, atributos `id` y `version`, encoding |
| 2 | Campos obligatorios infoTributaria | RUC, razón social, codDoc, estab, ptoEmi, secuencial, ambiente |
| 3 | Cálculo de impuestos | Totales, bases imponibles, IVA, redondeo a 2/6 decimales |
| 4 | Validación de entrada | Rechaza datos incompletos, RUC/cédula inválidos, valores negativos |
| 5 | Clave de acceso | 49 dígitos, Módulo 11 correcto, tipo doc en posición [9-10] |
| 6 | Campos específicos del tipo | Doc sustento (NC/ND/Ret), transportista (GR), proveedor (LC) |
| 7 | Formato SRI | Fechas dd/mm/aaaa, secuencial 9 dígitos con ceros, sin espacios en alfanuméricos |

### F.3 Ejecución de Tests

```bash
# Desde la raíz del proyecto
npm test                          # Ejecutar todos los tests
npm test -- --reporter=verbose    # Con detalle
npm test -- xml-builder           # Solo tests de XML builders
npm test -- --coverage            # Con cobertura de código
```

**Criterio de éxito:** 42/42 tests pasan (verde). Cobertura de código > 80% en los módulos `src/lib/sri/`.

### F.4 Tests Adicionales Recomendados

Si el tiempo permite, añadir estos tests complementarios:

| Grupo | Tests | Descripción |
|:--|:--:|:--|
| Clave de acceso | 5 | Módulo 11 con diferentes RUCs, tipos doc, secuenciales |
| Validadores RUC/Cédula | 5 | Números válidos e inválidos, formatos incorrectos |
| Firma XAdES-BES | 3 | Firma genera correctamente, estructura SignedProperties |
| Orquestador | 5 | Flujo completo mock para cada tipo, manejo de errores |
| ATS Builder | 5 | Estructura XML ATS, encoding ISO-8859-1, exclusiones |
| RDEP Builder | 3 | Estructura XML RDEP, datos empleado |

---

## FASE G — INTEGRACIÓN END-TO-END COMPLETA (Día 8)

### G.1 Flujo Completo por Tipo de Comprobante

Ejecutar el flujo completo para cada tipo verificando toda la cadena:

```
UI Form → Validación Zod → Server Action → Orquestador → XML Builder 
→ Firma XAdES → SOAP Recepción SRI → SOAP Autorización SRI 
→ Estado AUT → RIDE PDF → (Email opcional)
```

| # | Tipo | Flujo E2E | RIDE | Email | sri_log |
|:--:|:--|:--:|:--:|:--:|:--:|
| G.1.1 | Factura (01) | ☐ | ☐ | ☐ | ☐ |
| G.1.2 | Liquidación (03) | ☐ | ☐ | ☐ | ☐ |
| G.1.3 | Nota Crédito (04) | ☐ | ☐ | ☐ | ☐ |
| G.1.4 | Nota Débito (05) | ☐ | ☐ | ☐ | ☐ |
| G.1.5 | Guía Remisión (06) | ☐ | ☐ | ☐ | ☐ |
| G.1.6 | Retención (07) | ☐ | ☐ | ☐ | ☐ |

### G.2 Flujos de Error y Recuperación

| # | Escenario | Acción | Resultado Esperado |
|:--:|:--|:--|:--|
| G.2.1 | RUC receptor inválido | Enviar comprobante con RUC malo | SRI rechaza con error 46 "RUC no existe", estado NAT |
| G.2.2 | Certificado expirado | Simular certificado vencido | Error de firma, comprobante no se envía |
| G.2.3 | SRI no disponible | Simular timeout | Error de conexión, estado ENVIADO pendiente re-intento |
| G.2.4 | Reenviar comprobante rechazado | Corregir datos y reenviar | Misma clave acceso y secuencial, SRI autoriza |
| G.2.5 | Anular comprobante | Usar acción `anularComprobante()` | Estado cambia a ANULADO en BD |
| G.2.6 | Re-consultar autorización | Usar `reConsultarAutorizacion()` | Consulta WS Autorización con clave acceso existente |

### G.3 Flujo Reportes E2E

| # | Reporte | Generación | Descarga XML | Descarga Excel | BD |
|:--:|:--|:--:|:--:|:--:|:--:|
| G.3.1 | ATS Mensual | ☐ | ☐ | ☐ | ☐ |
| G.3.2 | RDEP Anual | ☐ | ☐ | ☐ | ☐ |
| G.3.3 | Form 104 | ☐ | — | ☐ | ☐ |
| G.3.4 | Form 103 | ☐ | — | ☐ | ☐ |
| G.3.5 | Ventas | ☐ | — | ☐ | ☐ |
| G.3.6 | Chat IA | ☐ | — | — | — |

---

## FASE H — CORRECCIONES DE SEGURIDAD (Día 8)

### H.1 Corregir `search_path` Mutable en Función

**Problema:** La función `calcular_total_ventas_periodo()` tiene un `search_path` mutable que podría permitir inyección de schema.

**Solución — Migración SQL:**

```sql
-- Migración: 012_fix_search_path_security.sql

-- Recrear función con search_path inmutable
CREATE OR REPLACE FUNCTION calcular_total_ventas_periodo(
  p_empresa_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin DATE
) RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total) 
     FROM public.comprobantes 
     WHERE empresa_id = p_empresa_id 
       AND tipo_comprobante = '01'
       AND estado = 'AUTORIZADO'
       AND fecha_emision BETWEEN p_fecha_inicio AND p_fecha_fin),
    0
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;  -- Fijar search_path

-- Verificar
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname = 'calcular_total_ventas_periodo';
-- proconfig debe mostrar: {search_path=public}
```

### H.2 Habilitar Protección contra Contraseñas Filtradas

**Problema:** Supabase Auth no tiene habilitada la verificación contra bases de datos de contraseñas comprometidas (HaveIBeenPwned).

**Solución:**

| # | Paso | Acción |
|:--:|:--|:--|
| H.2.1 | Ir a Supabase Dashboard | Authentication → Settings |
| H.2.2 | Buscar "Leaked password protection" | Sección de seguridad |
| H.2.3 | Habilitar la opción | Toggle ON |
| H.2.4 | Verificar | Intentar registrar con contraseña conocida como filtrada (ej: "password123") |

### H.3 Verificación Post-Corrección con Advisors

```sql
-- Ejecutar después de las correcciones
-- Verificar que no quedan advisors de seguridad pendientes
```

Usar `get_advisors` de Supabase MCP con tipo "security" y "performance" para confirmar que los warnings se resolvieron.

---

## RESUMEN EJECUTIVO — CHECKLIST FINAL

### Matriz de Completitud

| Fase | Descripción | Días | Estado |
|:--:|:--|:--:|:--:|
| A | Verificación de interfaz UI | 1 | ☐ |
| B | Factura nueva (01) — flujo base | 1-2 | ☐ |
| C.1 | Nota de Crédito (04) vs SRI | 2 | ☐ |
| C.2 | Nota de Débito (05) vs SRI | 2 | ☐ |
| C.3 | Retención (07) vs SRI | 3 | ☐ |
| C.4 | Guía de Remisión (06) vs SRI | 3 | ☐ |
| C.5 | Liquidación de Compra (03) vs SRI | 4 | ☐ |
| D.1 | Registrar compras recibidas | 5 | ☐ |
| D.2 | Registrar empleado | 5 | ☐ |
| E.1 | Generar ATS XML + validar | 5-6 | ☐ |
| E.2 | Generar RDEP XML + validar | 5-6 | ☐ |
| E.3 | Pre-llenado Form 104 | 6 | ☐ |
| E.4 | Pre-llenado Form 103 | 6 | ☐ |
| E.5 | Chat IA reportes | 6 | ☐ |
| F | Tests unitarios (42 tests) | 7 | ☐ |
| G | Integración end-to-end completa | 8 | ☐ |
| H | Correcciones de seguridad | 8 | ☐ |

### Métricas de Éxito

| Métrica | Objetivo | Mínimo Aceptable |
|:--|:--|:--|
| Comprobantes AUTORIZADOS por SRI | 6/6 tipos | 5/6 (permitir 1 reintento) |
| Tests unitarios pasando | 42/42 | 40/42 (≥95%) |
| Reportes generados exitosamente | 5/5 (ATS, RDEP, 104, 103, Ventas) | 4/5 |
| RIDE PDFs generados | 6/6 tipos | 6/6 (obligatorio) |
| Warnings seguridad resueltos | 2/2 | 2/2 (obligatorio) |
| Errores consola JS | 0 | 0 en pantallas principales |
| Cobertura tests XML builders | >80% | >70% |

### Tiempo Estimado Total: 8 días laborables

```
Día 1:     Fase A (UI) + inicio Fase B (factura)
Día 2:     Fase B (completar) + Fase C.1 (NC) + C.2 (ND)
Día 3:     Fase C.3 (Retención) + C.4 (Guía Remisión)
Día 4:     Fase C.5 (Liquidación) + C.6 (verificación cruzada)
Día 5:     Fase D (compras + empleados) + inicio Fase E
Día 6:     Fase E (reportes ATS/RDEP/104/103/IA)
Día 7:     Fase F (42 tests unitarios)
Día 8:     Fase G (integración E2E) + Fase H (seguridad)
```

---

*Plan elaborado a partir del análisis de fases (analisis-fases-facturia.md), plan SaaS v2 (plan-facturia-saas-v2.md), planes de fase 4 y 5, y Ficha Técnica Comprobantes Electrónicos Esquema Offline 2025 del SRI.*
