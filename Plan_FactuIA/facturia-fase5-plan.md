# facturIA — Fase 5: Reportes IA + ATS
## Plan de Implementación Detallado con Subagentes, Skills e IA Gemini 3 Flash

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 5 — Reportes IA + ATS (Semanas 13-15, 15 días hábiles)  
**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Cloud Run  
**IA:** Google Gemini 3 Flash (`gemini-3-flash-preview`) via Vercel AI SDK + Google GenAI SDK  
**Fecha:** Febrero 2026

---

# 1. ESTADO ACTUAL — Dependencias Completadas

## Fase 1 Completada ✅

| Entregable | Estado |
|---|---|
| Proyecto Next.js 15.5 + PWA + Dockerfile | ✅ |
| Sistema de diseño Glass/Ethereal B&W | ✅ |
| Layout dashboard mobile-first | ✅ |
| Autenticación Supabase + Auth Guard | ✅ |
| Schema BD multi-tenant con RLS | ✅ |
| CI/CD Pipeline (GitHub Actions → Cloud Run) | ✅ |
| Landing page | ✅ |

## Fase 2 Completada ✅

| Entregable | Estado |
|---|---|
| UI Ethereal Glass Monochrome (B&W) | ✅ |
| Subagentes Cursor corregidos (4 subagentes con frontmatter YAML) | ✅ |
| Skills Cursor corregidas (5 skills con frontmatter YAML) | ✅ |
| Config empresa + establecimiento + punto de emisión | ✅ |
| Upload .p12 + cifrado AES-256 + validación | ✅ |
| Onboarding IA con Gemini (chat 12 pasos) | ✅ |
| CRUD Clientes + validación RUC/Cédula | ✅ |
| CRUD Productos + config IVA/ICE | ✅ |
| Tests unitarios + integración | ✅ |
| Gemini API integrada (`gemini-client.js`) | ✅ |

## Fase 3 Completada ✅

| Entregable | Estado |
|---|---|
| Generador clave de acceso 49 dígitos + Módulo 11 | ✅ |
| XML Builder factura v1.1.0 / v2.1.0 | ✅ |
| Firma XAdES-BES con .p12 | ✅ |
| Cliente SOAP WS Recepción + Autorización SRI | ✅ |
| Flujo completo orquestado (BORRADOR → AUTORIZADO) | ✅ |
| RIDE PDF (representación impresa) | ✅ |
| Email automático XML + RIDE (Resend) | ✅ |
| Wizard factura con IA (Gemini 3 Flash + useChat) | ✅ |
| Listado comprobantes con filtros y estados | ✅ |
| Tests completos (unit + integration + e2e) | ✅ |
| Migración SDK IA: `@google/genai` + `@ai-sdk/google` | ✅ |
| Análisis errores SRI con IA | ✅ |

## Fase 4 Completada ✅

| Entregable | Estado |
|---|---|
| Nota de Crédito (codDoc: 04) — XML + UI + RIDE + autorización SRI | ✅ |
| Nota de Débito (codDoc: 05) — XML + UI + RIDE + autorización SRI | ✅ |
| Comprobante de Retención (codDoc: 07) — XML v2.0.0 ATS + UI + RIDE | ✅ |
| Guía de Remisión (codDoc: 06) — XML + UI + RIDE + autorización SRI | ✅ |
| Liquidación de Compra (codDoc: 03) — XML v1.1.0 + UI + RIDE | ✅ |
| Bucket `certificados` Supabase Storage resuelto | ✅ |
| Firma electrónica .p12 funcional end-to-end | ✅ |
| Resend key implementada — email XML + RIDE funcional | ✅ |
| Comprobantes procesados en estado AUTORIZADO | ✅ |
| Orquestador unificado todos los tipos | ✅ |
| IA contextual por tipo de comprobante | ✅ |
| Migración BD `007_comprobantes_adicionales.sql` aplicada | ✅ |
| Tablas `retenciones_detalle`, `guia_remision_destinatarios`, `guia_remision_detalles` con RLS | ✅ |

---

# 2. RESUMEN EJECUTIVO — FASE 5

La **Fase 5** implementa el **módulo de reportes tributarios con IA** para facturIA. Es la fase que convierte a facturIA de un "emisor de comprobantes" en una **plataforma de inteligencia tributaria**.

## 2.1 Entregables

| # | Entregable | Descripción | Prioridad |
|---|---|---|---|
| 1 | **Generador ATS** | XML automático mensual/semestral compatible con esquema `at.xsd` del SRI | CRÍTICA |
| 2 | **Generador RDEP** | XML anual compatible con esquema `RDEP.xsd` del SRI | ALTA |
| 3 | **Pre-llenado Form. 104** | Datos consolidados para declaración IVA mensual/semestral | ALTA |
| 4 | **Pre-llenado Form. 103** | Datos consolidados para retenciones en la fuente | ALTA |
| 5 | **Motor análisis IA** | Detección anomalías, proyecciones, sugerencias tributarias | MEDIA |
| 6 | **Chat IA reportes** | Consultas en lenguaje natural sobre datos fiscales | MEDIA |
| 7 | **Exportación** | Excel (.xlsx) y PDF de todos los reportes | ALTA |

## 2.2 Arquitectura de Datos

```
┌──────────────────────────────────────────────────────────────────┐
│                    FUENTES DE DATOS (BD Supabase)                │
│                                                                  │
│  comprobantes (01,03,04,05,06,07) · comprobante_detalles        │
│  retenciones_detalle · clientes · productos · empresas          │
│  establecimientos · puntos_emision · secuenciales               │
└────────────┬───────────────────────────────────────┬─────────────┘
             │                                       │
             ▼                                       ▼
┌────────────────────────┐           ┌───────────────────────────┐
│   Motor Consolidación  │           │   Motor Análisis IA       │
│                        │           │   (Gemini 3 Flash)        │
│  • Agrupa por período  │           │                           │
│  • Clasifica compras   │           │  • Detecta anomalías      │
│  • Clasifica ventas    │           │  • Proyecta impuestos     │
│  • Calcula bases imp.  │           │  • Sugiere optimización   │
│  • Identifica anulados │           │  • Valida consistencia    │
│  • Cuadra retenciones  │           │  • Calcula vencimientos   │
└────────┬───────────────┘           └───────────┬───────────────┘
         │                                       │
         ▼                                       ▼
┌────────────────────────┐           ┌───────────────────────────┐
│   Generadores XML      │           │   Chat IA Reportes        │
│                        │           │                           │
│  • ATS (at.xsd)        │           │  Consultas lenguaje       │
│  • RDEP (RDEP.xsd)     │           │  natural sobre datos      │
│  • Form 104 datos      │           │  fiscales del período     │
│  • Form 103 datos      │           │                           │
└────────┬───────────────┘           └───────────────────────────┘
         │
         ▼
┌────────────────────────┐
│   Exportadores         │
│                        │
│  • XML (SRI)           │
│  • Excel (.xlsx)       │
│  • PDF (resumen)       │
└────────────────────────┘
```

## 2.3 Reutilización de Infraestructura Existente

| Componente existente | Reutilización en Fase 5 |
|---|---|
| `gemini-client.js` | Base del motor IA para análisis y chat |
| `@ai-sdk/google` + `useChat` | Chat IA reportes (mismo patrón que wizard factura) |
| RIDE PDF generator (`jspdf`) | Exportar reportes a PDF |
| Supabase RLS multi-tenant | Queries filtradas por empresa_id automáticamente |
| GlassCard, GlassTable, GlassModal | UI reportes con diseño Ethereal B&W |
| Server Actions pattern | Generación de reportes server-side |
| Resend email service | Envío de reportes por email |

**Estimación de reutilización: ~60%** — La lógica de consolidación tributaria y generación de XML ATS/RDEP es nueva, pero toda la infraestructura de IA, UI, BD y exportación ya existe.

## 2.4 Duración y Cronograma

**Duración:** 15 días hábiles (3 semanas)  
**Modelo IA:** `gemini-3-flash-preview` con prompts tributarios especializados  
**Resultado:** Reportes ATS, RDEP, Form. 104/103 generados automáticamente con validación IA

---

# 3. REGLAS TRIBUTARIAS CRÍTICAS PARA REPORTES

## 3.1 ATS — Reglas de Exclusión Electrónica

**Regla fundamental del SRI (Resolución NAC-DGERCGC16-00000092):**

> Los comprobantes electrónicos autorizados por el SRI **NO se reportan** en ciertos módulos del ATS porque ya están en la base de datos del SRI.

| Módulo ATS | Qué se reporta | Qué se EXCLUYE |
|---|---|---|
| **Compras** | Compras con retención NO electrónica; compras sin retención | Retenciones electrónicas (codDoc 07) autorizadas desde enero 2018 |
| **Ventas** | Facturas/NC/ND emitidas en preimpreso o que NO son electrónicas | Facturas (01), NC (04), ND (05) electrónicas autorizadas |
| **Anulados** | Comprobantes anulados (todos los tipos) | Comprobantes electrónicos anulados (estos NO van en ATS) |
| **Exportaciones** | Facturas de exportación | — |
| **Reembolsos** | Facturas de reembolso (cod. 41, 47, 48) | — |

**Implicación para facturIA:** Como facturIA es 100% electrónico, el ATS generado tendrá:
- **Compras:** Solo las compras registradas manualmente que NO tengan retención electrónica asociada
- **Ventas:** Vacío o mínimo (solo comprobantes NO electrónicos si se registran manualmente)
- **Anulados:** Solo comprobantes preimpresos anulados (no electrónicos)

**Decisión de diseño:** facturIA debe permitir al usuario **registrar compras/gastos recibidos** (facturas de proveedores) para poder generar un ATS completo. Esto requiere un módulo de registro de compras.

## 3.2 Periodicidad del ATS

| Tipo de contribuyente | Periodicidad | Meses |
|---|---|---|
| Sociedades | Mensual | 01–12 |
| Personas naturales obligadas a llevar contabilidad | Mensual | 01–12 |
| Agentes de retención | Mensual | 01–12 |
| RIMPE Emprendedores | Semestral | 1er: ene-jun (período 06), 2do: jul-dic (período 12) |

**Fecha de vencimiento:** Según noveno dígito del RUC:

| 9no dígito | Fecha límite |
|---|---|
| 1 | 10 del mes siguiente |
| 2 | 12 del mes siguiente |
| 3 | 14 del mes siguiente |
| 4 | 16 del mes siguiente |
| 5 | 18 del mes siguiente |
| 6 | 20 del mes siguiente |
| 7 | 22 del mes siguiente |
| 8 | 24 del mes siguiente |
| 9 | 26 del mes siguiente |
| 0 | 28 del mes siguiente |

## 3.3 Bancarización

**Desde diciembre 2023:** Si la sumatoria de bases imponibles + montos de impuestos de una compra es **mayor a USD $500.00**, se debe reportar la forma de pago obligatoriamente (campo condicional en compras del ATS).

## 3.4 Tarifas IVA Vigentes 2026

| Código | Tarifa | Descripción |
|---|---|---|
| 0 | 0% | Tarifa 0% |
| 2 | 12% | Tarifa 12% |
| 3 | 14% | Tarifa 14% |
| 4 | 15% | Tarifa 15% |
| 5 | 5% | Tarifa 5% |
| 6 | — | No Objeto de IVA |
| 7 | — | Exento de IVA |
| 8 | — | IVA diferenciado |
| 10 | 13% | Tarifa 13% |

---

# 4. BASE DE DATOS — Migración Fase 5

## 4.1 Archivo: `supabase/migrations/008_reportes_sri.sql`

```sql
-- =============================================
-- MIGRACIÓN FASE 5: Reportes SRI + Compras recibidas
-- =============================================

-- =============================================
-- TABLA: compras_recibidas
-- Registra compras/gastos recibidos de proveedores
-- (facturas que la empresa RECIBE, no emite)
-- Necesario para generar el módulo de compras del ATS
-- =============================================
CREATE TABLE compras_recibidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Datos del proveedor
  tipo_id_proveedor VARCHAR(2) NOT NULL,        -- Tabla 2 ATS: 01=RUC, 02=Cédula, 03=Pasaporte
  identificacion_proveedor VARCHAR(20) NOT NULL,
  razon_social_proveedor VARCHAR(300) NOT NULL,
  
  -- Documento
  tipo_comprobante VARCHAR(3) NOT NULL,          -- Tabla 4 ATS: 01=Factura, 02=NV, 03=LC, etc.
  cod_sustento VARCHAR(2) NOT NULL,              -- Tabla 5 ATS: 01=Crédito trib. adq. bienes/serv.
  establecimiento VARCHAR(3) NOT NULL,
  punto_emision VARCHAR(3) NOT NULL,
  secuencial VARCHAR(9) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_registro DATE NOT NULL,                  -- Fecha de registro contable
  autorizacion VARCHAR(49),                      -- Número de autorización (preimpreso o electrónico)
  
  -- Montos
  base_no_grava_iva DECIMAL(14,2) DEFAULT 0,
  base_imponible_0 DECIMAL(14,2) DEFAULT 0,
  base_imponible_iva DECIMAL(14,2) DEFAULT 0,   -- Base gravada con IVA
  base_imp_exenta DECIMAL(14,2) DEFAULT 0,
  monto_iva DECIMAL(14,2) DEFAULT 0,
  monto_ice DECIMAL(14,2) DEFAULT 0,
  
  -- Retenciones asociadas
  retencion_renta DECIMAL(14,2) DEFAULT 0,
  retencion_iva DECIMAL(14,2) DEFAULT 0,
  
  -- Forma de pago (obligatorio si bases + impuestos > $500)
  forma_pago VARCHAR(2),                         -- Tabla 13 ATS: 01=Sin SF, 16=Tarjeta, etc.
  
  -- Pago exterior
  pago_loc_ext VARCHAR(2) DEFAULT '01',          -- 01=Local, 02=Exterior
  pais_pago VARCHAR(3),                          -- Código país si exterior
  
  -- Parte relacionada
  parte_relacionada VARCHAR(2) DEFAULT 'NO',     -- SI / NO
  
  -- Referencia a retención electrónica emitida (si existe)
  comprobante_retencion_id UUID REFERENCES comprobantes(id),
  
  -- Control
  incluir_ats BOOLEAN DEFAULT true,              -- Si incluir o no en el ATS
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: compras_recibidas_retenciones
-- Detalle de retenciones por compra (AIR/IVA/ISD)
-- =============================================
CREATE TABLE compras_recibidas_retenciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras_recibidas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  tipo_retencion VARCHAR(1) NOT NULL,            -- 1=Renta (AIR), 2=IVA, 6=ISD
  codigo_retencion VARCHAR(5) NOT NULL,          -- Código tabla 3/3.1/20/21 del Catálogo ATS
  base_imponible DECIMAL(14,2) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  valor_retenido DECIMAL(14,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: reportes_generados
-- Historial de reportes generados por la empresa
-- =============================================
CREATE TABLE reportes_generados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  tipo VARCHAR(20) NOT NULL,                     -- 'ats', 'rdep', 'form104', 'form103', 'ventas', 'analisis'
  anio INT NOT NULL,
  mes INT,                                       -- NULL para RDEP (anual)
  semestre INT,                                  -- 1 o 2, solo para RIMPE semestral
  
  -- Resultado
  estado VARCHAR(20) DEFAULT 'generando',        -- 'generando', 'completado', 'error', 'validado'
  xml_path TEXT,                                 -- Path en Supabase Storage
  excel_path TEXT,
  pdf_path TEXT,
  
  -- Validación IA
  alertas JSONB DEFAULT '[]',                    -- Alertas detectadas por IA
  resumen_ia TEXT,                               -- Resumen en lenguaje natural
  
  -- Metadata
  total_registros INT DEFAULT 0,
  total_compras DECIMAL(14,2) DEFAULT 0,
  total_ventas DECIMAL(14,2) DEFAULT 0,
  total_retenciones DECIMAL(14,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: empleados (para RDEP)
-- Datos de nómina para generar RDEP anual
-- =============================================
CREATE TABLE empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  tipo_identificacion VARCHAR(2) NOT NULL,       -- C=Cédula, R=RUC, P=Pasaporte
  identificacion VARCHAR(20) NOT NULL,
  apellidos VARCHAR(200) NOT NULL,
  nombres VARCHAR(200) NOT NULL,
  
  -- Datos laborales
  fecha_ingreso DATE NOT NULL,
  fecha_salida DATE,
  cargo VARCHAR(200),
  tipo_contrato VARCHAR(2),                      -- 01=Indefinido, 02=Fijo, etc.
  
  -- Ingresos del período (se actualiza por período)
  sueldo_mensual DECIMAL(14,2) DEFAULT 0,
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(empresa_id, identificacion)
);

-- =============================================
-- TABLA: empleados_ingresos_anuales (detalle RDEP)
-- =============================================
CREATE TABLE empleados_ingresos_anuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  anio INT NOT NULL,
  
  -- Ingresos
  sueldo_salario DECIMAL(14,2) DEFAULT 0,
  sobresueldos DECIMAL(14,2) DEFAULT 0,
  participacion_utilidades DECIMAL(14,2) DEFAULT 0,
  ingresos_gravados DECIMAL(14,2) DEFAULT 0,
  decimo_tercero DECIMAL(14,2) DEFAULT 0,
  decimo_cuarto DECIMAL(14,2) DEFAULT 0,
  fondos_reserva DECIMAL(14,2) DEFAULT 0,
  otros_ingresos_gravados DECIMAL(14,2) DEFAULT 0,
  ingresos_gravados_empleador DECIMAL(14,2) DEFAULT 0,
  
  -- Deducciones
  aporte_iess_personal DECIMAL(14,2) DEFAULT 0,
  
  -- Impuesto a la renta
  impuesto_renta_causado DECIMAL(14,2) DEFAULT 0,
  valor_retenido DECIMAL(14,2) DEFAULT 0,
  
  -- Gastos personales deducibles
  gastos_vivienda DECIMAL(14,2) DEFAULT 0,
  gastos_salud DECIMAL(14,2) DEFAULT 0,
  gastos_educacion DECIMAL(14,2) DEFAULT 0,
  gastos_alimentacion DECIMAL(14,2) DEFAULT 0,
  gastos_vestimenta DECIMAL(14,2) DEFAULT 0,
  gastos_turismo DECIMAL(14,2) DEFAULT 0,
  
  -- Sistema de salarios netos
  sistema_salario_neto BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(empleado_id, anio)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_compras_recibidas_empresa_periodo 
  ON compras_recibidas(empresa_id, fecha_emision);

CREATE INDEX idx_compras_recibidas_proveedor 
  ON compras_recibidas(empresa_id, identificacion_proveedor);

CREATE INDEX idx_reportes_empresa_tipo_periodo 
  ON reportes_generados(empresa_id, tipo, anio, mes);

CREATE INDEX idx_empleados_empresa 
  ON empleados(empresa_id);

CREATE INDEX idx_empleados_ingresos_periodo 
  ON empleados_ingresos_anuales(empresa_id, anio);

-- =============================================
-- RLS: Row Level Security
-- =============================================

-- compras_recibidas
ALTER TABLE compras_recibidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven compras de su empresa" ON compras_recibidas
  FOR SELECT USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios insertan compras de su empresa" ON compras_recibidas
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios actualizan compras de su empresa" ON compras_recibidas
  FOR UPDATE USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios eliminan compras de su empresa" ON compras_recibidas
  FOR DELETE USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- compras_recibidas_retenciones
ALTER TABLE compras_recibidas_retenciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven retenciones compras de su empresa" ON compras_recibidas_retenciones
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- reportes_generados
ALTER TABLE reportes_generados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven reportes de su empresa" ON reportes_generados
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- empleados
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven empleados de su empresa" ON empleados
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- empleados_ingresos_anuales
ALTER TABLE empleados_ingresos_anuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven ingresos empleados de su empresa" ON empleados_ingresos_anuales
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- BUCKET: reportes (Supabase Storage)
-- =============================================
-- Ejecutar manualmente en Supabase Dashboard o vía API:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('reportes', 'reportes', false, 10485760);  -- 10MB max
```

---

# 5. ESTRUCTURA DE ARCHIVOS — Fase 5

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── reportes/
│   │   │   ├── page.js                    # Hub reportes (ya existe, se extiende)
│   │   │   ├── ats/
│   │   │   │   └── page.js                # ★ Generador ATS
│   │   │   ├── rdep/
│   │   │   │   └── page.js                # ★ Generador RDEP
│   │   │   ├── iva/
│   │   │   │   └── page.js                # ★ Pre-llenado Form 104
│   │   │   ├── retenciones/
│   │   │   │   └── page.js                # ★ Pre-llenado Form 103
│   │   │   ├── ventas/
│   │   │   │   └── page.js                # ★ Reporte de ventas
│   │   │   └── analisis/
│   │   │       └── page.js                # ★ Análisis IA interactivo
│   │   ├── compras/
│   │   │   └── page.js                    # ★ CRUD compras recibidas
│   │   └── empleados/
│   │       └── page.js                    # ★ CRUD empleados (para RDEP)
│   └── api/
│       └── reportes/
│           ├── chat/route.js              # ★ API chat IA reportes (streaming)
│           └── generar/route.js           # ★ API generación async
│
├── lib/
│   ├── reportes/
│   │   ├── ats-builder.js                 # ★ Constructor XML ATS (at.xsd)
│   │   ├── ats-consolidator.js            # ★ Consolidación datos para ATS
│   │   ├── ats-validator.js               # ★ Validador contra esquema at.xsd
│   │   ├── rdep-builder.js                # ★ Constructor XML RDEP (RDEP.xsd)
│   │   ├── form104-consolidator.js        # ★ Consolidación datos Form 104
│   │   ├── form103-consolidator.js        # ★ Consolidación datos Form 103
│   │   ├── ventas-report.js               # ★ Reporte de ventas
│   │   ├── excel-exporter.js              # ★ Exportador Excel (xlsx)
│   │   └── pdf-report.js                  # ★ Exportador PDF reportes
│   ├── ia/
│   │   ├── reportes-prompts.js            # ★ System prompts para reportes
│   │   └── analisis-tributario.js         # ★ Motor análisis IA
│   └── catalogos/
│       ├── ats-catalogo.js                # ★ Tablas del Catálogo ATS
│       └── retenciones-catalogo.js        # ★ Códigos retención vigentes
│
├── actions/
│   ├── reportes-actions.js                # ★ Server Actions reportes
│   ├── compras-actions.js                 # ★ Server Actions compras recibidas
│   └── empleados-actions.js               # ★ Server Actions empleados
│
└── components/
    └── reportes/
        ├── ATSGeneratorForm.jsx           # ★ Formulario generación ATS
        ├── RDEPGeneratorForm.jsx          # ★ Formulario generación RDEP
        ├── Form104View.jsx                # ★ Vista pre-llenado 104
        ├── Form103View.jsx                # ★ Vista pre-llenado 103
        ├── VentasReportView.jsx           # ★ Vista reporte ventas
        ├── AnalisisIAChat.jsx             # ★ Chat IA análisis tributario
        ├── ReporteAlertCard.jsx           # ★ Card alerta/anomalía
        ├── PeriodoSelector.jsx            # ★ Selector período mes/semestre/año
        └── ComprasRecibidas/
            ├── ComprasList.jsx            # ★ Listado compras recibidas
            └── CompraForm.jsx             # ★ Formulario registro compra
```

**Total archivos nuevos: ~30**

---

# 6. GENERADOR ATS — Detalle Técnico

## 6.1 Estructura XML del ATS (esquema `at.xsd`)

El XML del ATS sigue la estructura raíz `<iva>` con los siguientes módulos:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<iva>
  <!-- CABECERA -->
  <TipoIDInformante>R</TipoIDInformante>
  <IdInformante>1790012345001</IdInformante>
  <razonSocial>EMPRESA EJEMPLO S.A.</razonSocial>
  <Anio>2026</Anio>
  <Mes>01</Mes>
  <!-- Para RIMPE semestral: <regimenMicroempresa>SI</regimenMicroempresa> -->
  <numEstabRuc>001</numEstabRuc>
  <totalVentas>15000.00</totalVentas>
  <codigoOperativo>IVA</codigoOperativo>
  
  <!-- MÓDULO COMPRAS -->
  <compras>
    <detalleCompras>
      <codSustento>01</codSustento>
      <tpIdProv>01</tpIdProv>
      <idProv>1790098765001</idProv>
      <tipoComprobante>01</tipoComprobante>
      <parteRel>NO</parteRel>
      <fechaRegistro>2026-01-15</fechaRegistro>
      <establecimiento>001</establecimiento>
      <puntoEmision>001</puntoEmision>
      <secuencial>000000150</secuencial>
      <fechaEmision>15/01/2026</fechaEmision>
      <autorizacion>1501202601179001234500110010010000001501234567815</autorizacion>
      <baseNoGraIva>0.00</baseNoGraIva>
      <baseImponible>0.00</baseImponible>
      <baseImpGrav>500.00</baseImpGrav>
      <baseImpExe>0.00</baseImpExe>
      <montoIce>0.00</montoIce>
      <montoIva>75.00</montoIva>
      <valorRetBienes>0.00</valorRetBienes>
      <valorRetServicios>0.00</valorRetServicios>
      <valRetBien10>0.00</valRetBien10>
      <valRetServ20>0.00</valRetServ20>
      <valRetServ50>0.00</valRetServ50>
      <valorRetBienes100>0.00</valorRetBienes100>
      <valorRetServicios100>0.00</valorRetServicios100>
      <totbasesImpReemb>0.00</totbasesImpReemb>
      <pagoExterior>
        <pagoLocExt>01</pagoLocExt>
      </pagoExterior>
      <!-- Forma de pago: obligatorio si bases + impuestos > $500 -->
      <formasDePago>
        <formaPago>20</formaPago>
      </formasDePago>
      <!-- Retenciones de renta (AIR) -->
      <air>
        <detalleAir>
          <codRetAir>312</codRetAir>
          <baseImpAir>500.00</baseImpAir>
          <porcentajeAir>1.00</porcentajeAir>
          <valRetAir>5.00</valRetAir>
        </detalleAir>
      </air>
    </detalleCompras>
  </compras>
  
  <!-- MÓDULO VENTAS -->
  <ventas>
    <!-- Solo comprobantes NO electrónicos -->
    <detalleVentas>
      <tpIdCliente>04</tpIdCliente>
      <idCliente>1791234567001</idCliente>
      <parteRelVtas>NO</parteRelVtas>
      <tipoComprobante>01</tipoComprobante>
      <tipoEmision>F</tipoEmision>
      <numeroComprobantes>5</numeroComprobantes>
      <baseNoGraIva>0.00</baseNoGraIva>
      <baseImponible>0.00</baseImponible>
      <baseImpGrav>1500.00</baseImpGrav>
      <montoIva>225.00</montoIva>
      <montoIce>0.00</montoIce>
      <valorRetIva>0.00</valorRetIva>
      <valorRetRenta>15.00</valorRetRenta>
      <formaPago>20</formaPago>
    </detalleVentas>
  </ventas>
  
  <!-- MÓDULO ANULADOS -->
  <anulados>
    <detalleAnulados>
      <tipoComprobante>01</tipoComprobante>
      <establecimiento>001</establecimiento>
      <puntoEmision>001</puntoEmision>
      <secuencialInicio>000000045</secuencialInicio>
      <secuencialFin>000000045</secuencialFin>
      <autorizacion>1234567890</autorizacion>
    </detalleAnulados>
  </anulados>
  
  <!-- MÓDULO VENTAS POR ESTABLECIMIENTO -->
  <ventasEstablecimiento>
    <ventaEst>
      <codEstab>001</codEstab>
      <ventasEstab>15000.00</ventasEstab>
      <ivaComp>0.00</ivaComp>
    </ventaEst>
  </ventasEstablecimiento>
</iva>
```

## 6.2 Flujo de Generación ATS

```
1. Usuario selecciona período (año + mes o semestre)
2. Motor consolidación:
   a. Consulta compras_recibidas del período
   b. Consulta comprobantes electrónicos emitidos
   c. Clasifica ventas (excluye electrónicas autorizadas)
   d. Identifica comprobantes anulados
   e. Calcula totales por establecimiento
3. Validación IA (Gemini):
   a. Verifica bases imponibles cuadren
   b. Detecta códigos de retención inválidos
   c. Valida bancarización (>$500)
   d. Identifica anomalías
4. Genera XML compatible con at.xsd
5. Exporta: XML + Excel respaldo + PDF resumen
6. Guarda en reportes_generados
```

## 6.3 Implementación: `ats-consolidator.js`

```javascript
// src/lib/reportes/ats-consolidator.js

/**
 * Consolida todos los datos de un período para generar el ATS
 * @param {string} empresaId - UUID de la empresa
 * @param {number} anio - Año fiscal
 * @param {number} mes - Mes (01-12) o semestre (06=1er, 12=2do)
 * @param {boolean} esSemestral - Si es RIMPE semestral
 * @returns {Object} Datos consolidados listos para construir XML
 */
export async function consolidarDatosATS(supabase, empresaId, anio, mes, esSemestral = false) {
  // 1. Obtener datos de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*, establecimientos(*)')
    .eq('id', empresaId)
    .single();

  // 2. Determinar rango de fechas
  let fechaInicio, fechaFin;
  if (esSemestral) {
    if (mes === 6) {
      fechaInicio = `${anio}-01-01`;
      fechaFin = `${anio}-06-30`;
    } else {
      fechaInicio = `${anio}-07-01`;
      fechaFin = `${anio}-12-31`;
    }
  } else {
    fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(anio, mes, 0).getDate();
    fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${lastDay}`;
  }

  // 3. Compras recibidas (con sus retenciones)
  const { data: compras } = await supabase
    .from('compras_recibidas')
    .select('*, compras_recibidas_retenciones(*)')
    .eq('empresa_id', empresaId)
    .eq('incluir_ats', true)
    .gte('fecha_registro', fechaInicio)
    .lte('fecha_registro', fechaFin);

  // 4. Excluir compras que tengan retención electrónica autorizada
  const comprasParaATS = (compras || []).filter(c => {
    if (c.comprobante_retencion_id) {
      // Si tiene retención electrónica, NO reportar en compras ATS
      return false;
    }
    return true;
  });

  // 5. Ventas NO electrónicas (las electrónicas ya están en el SRI)
  // En facturIA todo es electrónico, pero permitimos registro manual
  const { data: ventasNoElectronicas } = await supabase
    .from('comprobantes')
    .select('*')
    .eq('empresa_id', empresaId)
    .in('tipo_comprobante', ['01', '04', '05'])
    .eq('es_electronico', false)  // Solo NO electrónicas
    .gte('fecha_emision', fechaInicio)
    .lte('fecha_emision', fechaFin);

  // 6. Comprobantes anulados (solo NO electrónicos)
  const { data: anulados } = await supabase
    .from('comprobantes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('estado', 'voided')
    .eq('es_electronico', false)
    .gte('fecha_emision', fechaInicio)
    .lte('fecha_emision', fechaFin);

  // 7. Calcular total ventas (todas, para cabecera)
  const { data: totalVentasData } = await supabase
    .rpc('calcular_total_ventas_periodo', {
      p_empresa_id: empresaId,
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin,
    });

  // 8. Ventas por establecimiento
  const ventasPorEstab = calcularVentasPorEstablecimiento(
    empresa.establecimientos,
    totalVentasData
  );

  return {
    cabecera: {
      tipoIdInformante: 'R',
      idInformante: empresa.ruc,
      razonSocial: normalizarRazonSocial(empresa.razon_social),
      anio,
      mes: String(mes).padStart(2, '0'),
      regimenMicroempresa: esSemestral ? 'SI' : undefined,
      numEstabRuc: String(empresa.establecimientos?.length || 1).padStart(3, '0'),
      totalVentas: totalVentasData?.total || '0.00',
      codigoOperativo: 'IVA',
    },
    compras: comprasParaATS,
    ventas: ventasNoElectronicas || [],
    anulados: anulados || [],
    ventasEstablecimiento: ventasPorEstab,
    periodo: { fechaInicio, fechaFin, esSemestral },
  };
}

/**
 * Normaliza razón social para ATS (solo alfanumérico + espacios)
 */
function normalizarRazonSocial(razonSocial) {
  return razonSocial
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Quitar tildes
    .replace(/[^a-zA-Z0-9\s]/g, '')   // Solo alfanumérico
    .trim()
    .substring(0, 500);
}
```

## 6.4 Implementación: `ats-builder.js`

```javascript
// src/lib/reportes/ats-builder.js

/**
 * Construye el XML del ATS compatible con esquema at.xsd
 * @param {Object} datos - Datos consolidados del ats-consolidator
 * @returns {string} XML del ATS
 */
export function construirXMLATS(datos) {
  const { cabecera, compras, ventas, anulados, ventasEstablecimiento } = datos;

  let xml = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
  xml += '<iva>\n';

  // === CABECERA ===
  xml += `  <TipoIDInformante>${cabecera.tipoIdInformante}</TipoIDInformante>\n`;
  xml += `  <IdInformante>${cabecera.idInformante}</IdInformante>\n`;
  xml += `  <razonSocial>${escapeXml(cabecera.razonSocial)}</razonSocial>\n`;
  xml += `  <Anio>${cabecera.anio}</Anio>\n`;
  xml += `  <Mes>${cabecera.mes}</Mes>\n`;
  if (cabecera.regimenMicroempresa) {
    xml += `  <regimenMicroempresa>${cabecera.regimenMicroempresa}</regimenMicroempresa>\n`;
  }
  xml += `  <numEstabRuc>${cabecera.numEstabRuc}</numEstabRuc>\n`;
  xml += `  <totalVentas>${formatDecimal(cabecera.totalVentas)}</totalVentas>\n`;
  xml += `  <codigoOperativo>${cabecera.codigoOperativo}</codigoOperativo>\n`;

  // === MÓDULO COMPRAS ===
  if (compras.length > 0) {
    xml += '  <compras>\n';
    for (const compra of compras) {
      xml += construirDetalleCompra(compra);
    }
    xml += '  </compras>\n';
  }

  // === MÓDULO VENTAS ===
  if (ventas.length > 0) {
    xml += '  <ventas>\n';
    const ventasAgrupadas = agruparVentas(ventas);
    for (const venta of ventasAgrupadas) {
      xml += construirDetalleVenta(venta);
    }
    xml += '  </ventas>\n';
  }

  // === MÓDULO ANULADOS ===
  if (anulados.length > 0) {
    xml += '  <anulados>\n';
    for (const anulado of anulados) {
      xml += construirDetalleAnulado(anulado);
    }
    xml += '  </anulados>\n';
  }

  // === VENTAS POR ESTABLECIMIENTO ===
  xml += '  <ventasEstablecimiento>\n';
  for (const estab of ventasEstablecimiento) {
    xml += '    <ventaEst>\n';
    xml += `      <codEstab>${estab.codigo}</codEstab>\n`;
    xml += `      <ventasEstab>${formatDecimal(estab.totalVentas)}</ventasEstab>\n`;
    xml += `      <ivaComp>${formatDecimal(estab.ivaCompensado || 0)}</ivaComp>\n`;
    xml += '    </ventaEst>\n';
  }
  xml += '  </ventasEstablecimiento>\n';

  xml += '</iva>';
  return xml;
}

function construirDetalleCompra(compra) {
  let xml = '    <detalleCompras>\n';
  xml += `      <codSustento>${compra.cod_sustento}</codSustento>\n`;
  xml += `      <tpIdProv>${compra.tipo_id_proveedor}</tpIdProv>\n`;
  xml += `      <idProv>${compra.identificacion_proveedor}</idProv>\n`;
  xml += `      <tipoComprobante>${compra.tipo_comprobante}</tipoComprobante>\n`;
  xml += `      <parteRel>${compra.parte_relacionada}</parteRel>\n`;
  xml += `      <fechaRegistro>${formatFechaATS(compra.fecha_registro)}</fechaRegistro>\n`;
  xml += `      <establecimiento>${compra.establecimiento}</establecimiento>\n`;
  xml += `      <puntoEmision>${compra.punto_emision}</puntoEmision>\n`;
  xml += `      <secuencial>${compra.secuencial.padStart(9, '0')}</secuencial>\n`;
  xml += `      <fechaEmision>${formatFechaSlash(compra.fecha_emision)}</fechaEmision>\n`;
  xml += `      <autorizacion>${compra.autorizacion}</autorizacion>\n`;
  xml += `      <baseNoGraIva>${formatDecimal(compra.base_no_grava_iva)}</baseNoGraIva>\n`;
  xml += `      <baseImponible>${formatDecimal(compra.base_imponible_0)}</baseImponible>\n`;
  xml += `      <baseImpGrav>${formatDecimal(compra.base_imponible_iva)}</baseImpGrav>\n`;
  xml += `      <baseImpExe>${formatDecimal(compra.base_imp_exenta)}</baseImpExe>\n`;
  xml += `      <montoIce>${formatDecimal(compra.monto_ice)}</montoIce>\n`;
  xml += `      <montoIva>${formatDecimal(compra.monto_iva)}</montoIva>\n`;

  // Retenciones de IVA desglosadas
  const retIva = desglosarRetencionesIVA(compra.compras_recibidas_retenciones || []);
  xml += `      <valorRetBienes>${formatDecimal(retIva.bienes)}</valorRetBienes>\n`;
  xml += `      <valorRetServicios>${formatDecimal(retIva.servicios)}</valorRetServicios>\n`;
  xml += `      <valRetBien10>${formatDecimal(retIva.bien10)}</valRetBien10>\n`;
  xml += `      <valRetServ20>${formatDecimal(retIva.serv20)}</valRetServ20>\n`;
  xml += `      <valRetServ50>${formatDecimal(retIva.serv50)}</valRetServ50>\n`;
  xml += `      <valorRetBienes100>${formatDecimal(retIva.bienes100)}</valorRetBienes100>\n`;
  xml += `      <valorRetServicios100>${formatDecimal(retIva.servicios100)}</valorRetServicios100>\n`;
  xml += `      <totbasesImpReemb>0.00</totbasesImpReemb>\n`;

  // Pago exterior
  xml += '      <pagoExterior>\n';
  xml += `        <pagoLocExt>${compra.pago_loc_ext}</pagoLocExt>\n`;
  if (compra.pago_loc_ext === '02') {
    xml += `        <paisEfecPago>${compra.pais_pago}</paisEfecPago>\n`;
  }
  xml += '      </pagoExterior>\n';

  // Formas de pago (obligatorio si total > $500)
  const totalCompra = parseFloat(compra.base_imponible_iva || 0) + 
                      parseFloat(compra.base_imponible_0 || 0) + 
                      parseFloat(compra.monto_iva || 0);
  if (totalCompra > 500 || compra.forma_pago) {
    xml += '      <formasDePago>\n';
    xml += `        <formaPago>${compra.forma_pago || '20'}</formaPago>\n`;
    xml += '      </formasDePago>\n';
  }

  // Retenciones AIR (Renta)
  const retAir = (compra.compras_recibidas_retenciones || [])
    .filter(r => r.tipo_retencion === '1');
  if (retAir.length > 0) {
    xml += '      <air>\n';
    for (const ret of retAir) {
      xml += '        <detalleAir>\n';
      xml += `          <codRetAir>${ret.codigo_retencion}</codRetAir>\n`;
      xml += `          <baseImpAir>${formatDecimal(ret.base_imponible)}</baseImpAir>\n`;
      xml += `          <porcentajeAir>${formatDecimal(ret.porcentaje)}</porcentajeAir>\n`;
      xml += `          <valRetAir>${formatDecimal(ret.valor_retenido)}</valRetAir>\n`;
      xml += '        </detalleAir>\n';
    }
    xml += '      </air>\n';
  }

  xml += '    </detalleCompras>\n';
  return xml;
}

// Funciones utilitarias
function formatDecimal(value) {
  return parseFloat(value || 0).toFixed(2);
}

function formatFechaATS(fecha) {
  // Formato: YYYY-MM-DD (para fechaRegistro)
  return fecha;
}

function formatFechaSlash(fecha) {
  // Formato: dd/mm/yyyy (para fechaEmision)
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

---

# 7. GENERADOR RDEP — Detalle Técnico

## 7.1 Estructura XML del RDEP (esquema `RDEP.xsd`)

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<rdep>
  <anioFiscal>2025</anioFiscal>
  <rucAgente>1790012345001</rucAgente>
  <empleado>
    <tipoIdentificacion>C</tipoIdentificacion>
    <identificacion>1712345678</identificacion>
    <apellidos>PEREZ LOPEZ</apellidos>
    <nombres>JUAN CARLOS</nombres>
    <esSistemaSalarioNeto>NO</esSistemaSalarioNeto>
    <periodoTrabajo>
      <mes>01</mes>
      <sueldoSalario>500.00</sueldoSalario>
      <sobresueldoComisionesBonosOtros>0.00</sobresueldoComisionesBonosOtros>
      <participacionUtilidades>0.00</participacionUtilidades>
      <ingresosGravados>500.00</ingresosGravados>
      <decimoTercero>41.67</decimoTercero>
      <decimoCuarto>37.50</decimoCuarto>
      <fondoReserva>41.67</fondoReserva>
      <otrosIngresosEnRelDependencia>0.00</otrosIngresosEnRelDependencia>
      <ingresosGravadosConEsteEmpleador>500.00</ingresosGravadosConEsteEmpleador>
      <aporteIESSConEsteEmpleador>47.25</aporteIESSConEsteEmpleador>
      <impuestoRentaCausado>0.00</impuestoRentaCausado>
      <valorRetenidoMensual>0.00</valorRetenidoMensual>
    </periodoTrabajo>
    <!-- Repetir por cada mes trabajado -->
    <gastosPersonales>
      <vivienda>0.00</vivienda>
      <salud>0.00</salud>
      <educacion>0.00</educacion>
      <alimentacion>0.00</alimentacion>
      <vestimenta>0.00</vestimenta>
      <turismo>0.00</turismo>
    </gastosPersonales>
  </empleado>
</rdep>
```

## 7.2 Implementación: `rdep-builder.js`

El generador RDEP recopila datos de la tabla `empleados` + `empleados_ingresos_anuales` y genera el XML compatible con `RDEP.xsd`. El proceso incluye validación IA de que los totales cuadren con las retenciones efectuadas.

---

# 8. PRE-LLENADO FORMULARIOS 104 Y 103

## 8.1 Formulario 104 — Declaración IVA

**Campos que genera facturIA automáticamente:**

| Casillero | Concepto | Fuente de datos |
|---|---|---|
| 411 | Ventas locales (excluye activos fijos) gravadas tarifa diferente de 0% | `comprobantes` tipo 01 autorizados, base gravada |
| 412 | Ventas de activos fijos gravadas | `comprobantes` con flag activo fijo |
| 421 | Ventas locales tarifa 0% que no dan derecho a crédito tributario | Ventas base 0% |
| 431 | Exportaciones de bienes | Facturas de exportación |
| 480 | Total transferencias | Suma 411-431 |
| 500 | Adquisiciones locales gravadas tarifa diferente de 0% (crédito tributario) | `compras_recibidas` base gravada |
| 510 | Adquisiciones locales gravadas tarifa 0% | `compras_recibidas` base 0% |
| 520 | Adquisiciones locales exentas | `compras_recibidas` base exenta |
| 531 | Importaciones gravadas | `compras_recibidas` importaciones |
| 601 | IVA cobrado en ventas | Calculado |
| 602 | IVA cobrado devoluciones NC | NC emitidas |
| 605 | Liquidación período IVA cobrado | 601 - 602 |
| 615 | Crédito tributario (IVA pagado en compras) | `compras_recibidas` monto_iva |

## 8.2 Formulario 103 — Retenciones en la Fuente

**Campos agrupados por código de retención:**

| Casillero | Concepto | Fuente |
|---|---|---|
| 302 | En relación de dependencia (empleados) | `empleados_ingresos_anuales.valor_retenido` |
| 303 | Honorarios profesionales personas naturales | `retenciones_detalle` con código 303 |
| 304 | Predomina intelecto | `retenciones_detalle` código 304 |
| 307 | Predomina mano de obra | `retenciones_detalle` código 307 |
| 309 | Publicidad y comunicación | `retenciones_detalle` código 309 |
| 310 | Transporte privado | `retenciones_detalle` código 310 |
| 312 | Bienes muebles | `retenciones_detalle` código 312 |
| 320 | Arrendamiento bienes inmuebles | `retenciones_detalle` código 320 |
| 322 | Seguros y reaseguros | `retenciones_detalle` código 322 |
| 332 | Otras retenciones aplicables 1% | `retenciones_detalle` código 332 |
| 340 | Otras retenciones aplicables 1.75% | `retenciones_detalle` código 340 |
| 343 | Pagos con tarjeta de crédito/débito | `retenciones_detalle` código 343 |

La consolidación agrupa por código, suma bases imponibles y valores retenidos, y presenta al usuario en un formato que mapea directamente a los casilleros del formulario 103.

---

# 9. MOTOR DE ANÁLISIS IA

## 9.1 System Prompts Especializados

```javascript
// src/lib/ia/reportes-prompts.js

export function getAnalisisSystemPrompt(empresa) {
  return `Eres el analista tributario IA de facturIA. Tu rol es analizar los datos 
fiscales de la empresa y detectar anomalías, generar proyecciones y dar sugerencias 
de optimización tributaria.

EMPRESA:
- RUC: ${empresa?.ruc}
- Razón Social: ${empresa?.razon_social}
- Obligado a contabilidad: ${empresa?.obligado_contabilidad ? 'SÍ' : 'NO'}
- Régimen: ${empresa?.regimen_fiscal}

REGLAS:
- Siempre responde en español
- Datos precisos con 2 decimales
- Si detectas una anomalía, explica por qué es un problema y cómo resolverla
- Para proyecciones, usa tendencia de los últimos 3-6 meses
- Calcula fechas de vencimiento según el noveno dígito del RUC: ${empresa?.ruc?.[8]}
- NUNCA inventes cifras, solo analiza los datos proporcionados
- Respuestas concisas, máximo 3 párrafos
- Cita normativa vigente cuando sea relevante`;
}

export const ATS_VALIDATOR_PROMPT = `Eres un validador experto del Anexo Transaccional 
Simplificado (ATS) del SRI de Ecuador. Revisa los datos antes de generar el XML.

VALIDACIONES OBLIGATORIAS:
1. Códigos de sustento válidos (Tabla 5 Catálogo ATS)
2. Tipos de comprobante válidos (Tabla 4 Catálogo ATS)
3. Formas de pago si total > $500 (bancarización desde dic 2023)
4. RUC/Cédula válidos (Módulo 11 / Módulo 10)
5. Bases imponibles cuadran con totales de impuestos
6. Retenciones con códigos vigentes (Tabla 3 Catálogo ATS)
7. No se reportan electrónicos en ventas ni retenciones electrónicas en compras
8. Fechas dentro del período declarado
9. Secuenciales válidos (1-999999999)
10. Parte relacionada correcta (SI/NO)

Responde en JSON con estructura:
{
  "valido": true/false,
  "errores": [{ "campo": "", "mensaje": "", "severidad": "error|warning" }],
  "advertencias": [{ "campo": "", "mensaje": "" }],
  "resumen": "texto resumen"
}`;
```

## 9.2 Análisis Automatizado

El motor analiza:

| Análisis | Descripción | Implementación |
|---|---|---|
| **Anomalías** | Facturas sin retención, montos inusuales, clientes recurrentes sin RUC | Reglas + IA |
| **Vencimientos** | Fecha declaración IVA/Retenciones según 9no dígito RUC | Cálculo automático |
| **Proyección** | Estimación impuestos a pagar basada en tendencia 3-6 meses | IA + aritmética |
| **Retenciones faltantes** | Compras >$50 sin retención asociada | Query BD |
| **Consistencia** | Bases imponibles cuadran entre Form 104 y ATS | Cruce matemático |
| **Optimización** | Gastos deducibles no registrados | IA sugiere |

## 9.3 Chat IA para Reportes

Reutiliza el mismo patrón del wizard de factura (`useChat` + API route con streaming):

```javascript
// src/app/api/reportes/chat/route.js
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  const { messages, empresaId, periodo } = await req.json();
  const supabase = await createClient();

  // Obtener datos fiscales del período para contexto
  const datosContexto = await obtenerContextoFiscal(supabase, empresaId, periodo);

  const result = await streamText({
    model: google('gemini-3-flash-preview'),
    system: `${getAnalisisSystemPrompt(datosContexto.empresa)}
    
DATOS FISCALES DEL PERÍODO ${periodo.mes}/${periodo.anio}:
- Total ventas: $${datosContexto.totalVentas}
- Total compras: $${datosContexto.totalCompras}
- IVA cobrado: $${datosContexto.ivaCobrado}
- IVA pagado: $${datosContexto.ivaPagado}
- Crédito tributario: $${datosContexto.creditoTributario}
- Retenciones emitidas: $${datosContexto.totalRetenciones}
- Comprobantes emitidos: ${datosContexto.totalComprobantes}
- Comprobantes anulados: ${datosContexto.totalAnulados}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

# 10. EXPORTACIÓN

## 10.1 Excel — Librería: `xlsx` (SheetJS)

```javascript
// src/lib/reportes/excel-exporter.js
import * as XLSX from 'xlsx';

export function exportarATSExcel(datosConsolidados) {
  const wb = XLSX.utils.book_new();

  // Hoja: Compras
  const comprasData = datosConsolidados.compras.map(c => ({
    'Cod. Sustento': c.cod_sustento,
    'RUC Proveedor': c.identificacion_proveedor,
    'Razón Social': c.razon_social_proveedor,
    'Tipo Comp.': c.tipo_comprobante,
    'Establecimiento': c.establecimiento,
    'Pto. Emisión': c.punto_emision,
    'Secuencial': c.secuencial,
    'Fecha Emisión': c.fecha_emision,
    'Base 0%': c.base_imponible_0,
    'Base Gravada': c.base_imponible_iva,
    'IVA': c.monto_iva,
    'Ret. Renta': c.retencion_renta,
    'Ret. IVA': c.retencion_iva,
    'Forma Pago': c.forma_pago,
  }));
  const wsCompras = XLSX.utils.json_to_sheet(comprasData);
  XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras');

  // Hoja: Ventas
  // Hoja: Anulados
  // Hoja: Resumen

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}
```

## 10.2 PDF — Librería: `jspdf` (ya instalada)

Reutiliza el mismo motor de RIDE PDF existente para generar reportes en PDF con formato profesional, incluyendo logotipo de la empresa, período, totales y detalles.

---

# 11. CRONOGRAMA — 15 Días Hábiles

## Semana 1: Base de Datos + Compras + Consolidación

| Día | Tarea | Subagente/Skill |
|---|---|---|
| 1 | Migración `008_reportes_sri.sql` + RLS + bucket storage | `db-migrator` + `supabase-rls` |
| 2 | CRUD Compras Recibidas (Server Actions + Validación Zod) | `backend-dev` + `nextjs-patterns` |
| 3 | UI Compras Recibidas (formulario + listado Glass) | `frontend-dev` + `glass-ui` |
| 4 | Motor consolidación ATS (`ats-consolidator.js`) | `backend-dev` + `sri-validator` |
| 5 | Constructor XML ATS (`ats-builder.js`) + validador | `backend-dev` + `sri-validator` |

## Semana 2: ATS UI + RDEP + Form 104/103

| Día | Tarea | Subagente/Skill |
|---|---|---|
| 6 | UI Generador ATS (formulario + preview + descarga) | `frontend-dev` + `glass-ui` |
| 7 | Validador ATS con IA (Gemini valida antes de generar) | `backend-dev` + IA |
| 8 | CRUD Empleados + Constructor RDEP | `backend-dev` + `db-migrator` |
| 9 | Consolidador Form. 104 (IVA) + UI vista pre-llenado | `backend-dev` + `frontend-dev` |
| 10 | Consolidador Form. 103 (Retenciones) + UI vista pre-llenado | `backend-dev` + `frontend-dev` |

## Semana 3: IA + Exportación + Integración

| Día | Tarea | Subagente/Skill |
|---|---|---|
| 11 | Motor análisis IA + system prompts tributarios | `backend-dev` + IA |
| 12 | Chat IA reportes (API route streaming + UI) | `frontend-dev` + `backend-dev` |
| 13 | Exportadores Excel + PDF + reporte de ventas | `backend-dev` |
| 14 | Hub de reportes (actualizar `/reportes/page.js` con links funcionales) | `frontend-dev` + `glass-ui` |
| 15 | Tests + QA + Deploy staging + verificación completa | `test-writer` |

---

# 12. CATÁLOGOS ATS — Tablas Requeridas

## 12.1 `src/lib/catalogos/ats-catalogo.js`

```javascript
/**
 * Tablas del Catálogo ATS del SRI
 * Fuente: Catálogo ATS actualización 22/sep/2025
 */

// Tabla 2: Tipo de identificación (compras)
export const TIPO_ID_PROVEEDOR = {
  '01': 'RUC',
  '02': 'Cédula',
  '03': 'Pasaporte',
};

// Tabla 4: Tipo de comprobante (compras)
export const TIPO_COMPROBANTE_ATS = {
  '01': 'Factura',
  '02': 'Nota de Venta - RISE',
  '03': 'Liquidación de Compra',
  '04': 'Nota de Crédito',
  '05': 'Nota de Débito',
  '06': 'Guía de Remisión',
  '07': 'Comprobante de Retención',
  '09': 'Tiquete de máquina registradora',
  '11': 'Pasajes expedidos por transporte',
  '12': 'Inst. del Estado / servicio público',
  '15': 'Comprobante de venta Inst. Financieras',
  '16': 'DAU / DAV',
  '18': 'Documentos autorizados SRI',
  '19': 'Comprobante de pago cuotas / aportes',
  '20': 'Documentos del Estado (agua, luz, teléfono)',
  '21': 'Carta de porte aéreo',
  '41': 'Comprobante de venta con reembolso',
  '42': 'Documento retención presuntiva / propia',
  '43': 'Liquidación compra de bienes muebles usados',
  '44': 'Comprobante de contribuciones y aportes',
  '45': 'Liquidación por prestaciones seguros',
  '47': 'Nota de crédito por reembolso',
  '48': 'Nota de débito por reembolso',
};

// Tabla 5: Código de sustento (obligatorio en compras)
export const COD_SUSTENTO = {
  '01': 'Crédito Trib. IVA - adq. bienes/servicios diferente de activos fijos',
  '02': 'Costo/Gasto IVA - adq. locales bienes que NO serán comercializados',
  '03': 'Activos fijos (crédito tributario / costo)',
  '04': 'Gasto - adq. servicios',
  '05': 'Gasto - adq. bienes muebles que serán comercializados',
  '06': 'Reembolso como intermediario',
  '07': 'Sustento de retención presuntiva',
  '08': 'Adquisiciones a contribuyentes RISE',
  '09': 'DAU / DAV',
  '10': 'Reembolso como mandante / constituente',
  '11': 'Gasto con retención en la fuente sin aplicar resolución contable',
  '12': 'Impuestos y retenciones presuntivos',
  '14': 'Pagos con convenio de doble tributación',
  '15': 'Pagos sin convenio de doble tributación',
};

// Tabla 13: Forma de pago
export const FORMA_PAGO_ATS = {
  '01': 'Sin utilización del sistema financiero',
  '02': 'Cheque propio',
  '03': 'Cheque de terceros',
  '04': 'Cheque certificado',
  '05': 'Cheque de gerencia',
  '06': 'Débito de cuenta',
  '07': 'Transferencia de fondos',
  '08': 'Nota de crédito bancaria',
  '09': 'Tarjeta prepago',
  '10': 'Pago con tarjeta de crédito no bancaria',
  '15': 'Compensación de deudas',
  '16': 'Tarjeta de débito',
  '17': 'Dinero electrónico',
  '18': 'Tarjeta prepago',
  '19': 'Tarjeta de crédito',
  '20': 'Otros con utilización del sistema financiero',
  '21': 'Endoso de títulos',
};

// Tabla tipo identificación ventas
export const TIPO_ID_CLIENTE_VENTAS = {
  '04': 'RUC',
  '05': 'Cédula',
  '06': 'Pasaporte',
  '07': 'Consumidor Final',
  '08': 'Identificación del exterior',
  '09': 'Placa',
};
```

## 12.2 Calendario de Vencimientos

```javascript
// src/lib/catalogos/vencimientos.js

/**
 * Calcula la fecha de vencimiento de declaraciones
 * según el 9no dígito del RUC
 */
export function calcularVencimiento(ruc, anio, mes) {
  const novenoDigito = parseInt(ruc[8]);
  const diasPorDigito = {
    1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
    6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
  };
  const dia = diasPorDigito[novenoDigito];
  
  // Mes siguiente al período
  let mesSiguiente = mes + 1;
  let anioVencimiento = anio;
  if (mesSiguiente > 12) {
    mesSiguiente = 1;
    anioVencimiento++;
  }
  
  return new Date(anioVencimiento, mesSiguiente - 1, dia);
}

/**
 * Calcula días restantes hasta el vencimiento
 */
export function diasParaVencimiento(ruc, anio, mes) {
  const vencimiento = calcularVencimiento(ruc, anio, mes);
  const hoy = new Date();
  const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
  return diff;
}
```

---

# 13. DEPENDENCIAS NPM NUEVAS

```bash
npm install xlsx          # SheetJS — Generación Excel
# jspdf ya está instalado (RIDE PDF)
# @ai-sdk/google ya está instalado
# @google/genai ya está instalado
```

**No se requieren dependencias adicionales significativas.** El stack existente cubre:
- `jspdf` → PDF reportes
- `@ai-sdk/google` + `ai` → Chat IA streaming
- `@google/genai` → Generación estructurada (validación)
- Supabase client → Queries BD
- `resend` → Envío reportes por email

---

# 14. DECISIONES DE DISEÑO

## 14.1 Registro de Compras Recibidas

**Problema:** facturIA es 100% electrónico (los comprobantes emitidos ya están en el SRI). Para un ATS completo, se necesita registrar las **compras** que la empresa recibe de proveedores.

**Solución:** Crear un módulo liviano de "Compras Recibidas" que:
- Permite registrar facturas de proveedores recibidas
- NO requiere firma electrónica ni envío al SRI (son de los proveedores)
- Asocia retenciones emitidas electrónicamente (de Fase 4)
- Alimenta el módulo de compras del ATS

**Alcance intencionalmente limitado:** No es un módulo contable completo. Solo registra lo mínimo necesario para generar el ATS.

## 14.2 Validación con IA vs Validación Algorítmica

| Tipo | Implementación | Ejemplo |
|---|---|---|
| Algorítmica (determinista) | Código JavaScript | RUC válido, secuencial en rango, total = suma |
| IA (heurística) | Gemini 3 Flash | "¿Es normal que esta empresa tenga 50 facturas de $499 al mismo proveedor?" |

Se usa **ambas**: validación algorítmica primero (rápida, determinista), luego validación IA para detección de anomalías no obvias.

## 14.3 Encoding ISO-8859-1

El esquema `at.xsd` del SRI declara encoding `ISO-8859-1`. El XML generado debe respetar esto:

```javascript
// El XML se genera como string UTF-8 internamente
// pero se declara como ISO-8859-1 en la cabecera XML
// porque el DIMM del SRI lo espera así
const xmlHeader = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
```

Para la descarga del archivo, se convierte a ISO-8859-1 usando `TextEncoder` o se mantiene en UTF-8 (el DIMM moderno acepta ambos).

---

# 15. CHECKLIST FINAL — FASE 5

## A. Base de Datos
- [ ] Migración `008_reportes_sri.sql` aplicada
- [ ] Tabla `compras_recibidas` con RLS
- [ ] Tabla `compras_recibidas_retenciones` con RLS
- [ ] Tabla `reportes_generados` con RLS
- [ ] Tabla `empleados` con RLS
- [ ] Tabla `empleados_ingresos_anuales` con RLS
- [ ] Índices de rendimiento creados
- [ ] Bucket `reportes` en Supabase Storage
- [ ] Campo `es_electronico` en tabla `comprobantes` (si no existe, agregar)

## B. CRUD Compras Recibidas
- [ ] Server Actions: crear, editar, eliminar, listar compras
- [ ] Validación Zod (RUC, cédula, montos, códigos ATS)
- [ ] Formulario UI con selector de proveedor, tipo comprobante, cod sustento
- [ ] Registro de retenciones por compra (AIR, IVA, ISD)
- [ ] Listado con filtros por período, proveedor, tipo
- [ ] Asociación opcional con comprobante de retención electrónico

## C. Generador ATS (Entregable Crítico)
- [ ] Consolidador recopila compras del período correctamente
- [ ] Excluye comprobantes electrónicos de ventas (regla SRI)
- [ ] Excluye retenciones electrónicas de compras (regla SRI, desde ene 2018)
- [ ] XML generado cumple esquema `at.xsd`
- [ ] Cabecera con datos empresa correctos
- [ ] Módulo compras con todos los campos obligatorios
- [ ] Módulo ventas solo con NO electrónicas
- [ ] Módulo anulados solo con NO electrónicos
- [ ] Ventas por establecimiento calculadas
- [ ] Bancarización ($500) aplicada correctamente
- [ ] Formas de pago incluidas cuando corresponde
- [ ] Retenciones AIR desglosadas correctamente
- [ ] Retenciones IVA desglosadas por porcentaje
- [ ] Encoding ISO-8859-1 en cabecera XML
- [ ] Validación IA antes de generar
- [ ] Descarga XML funcional
- [ ] Soporte mensual Y semestral (RIMPE)
- [ ] UI formulario generación con selector período
- [ ] Preview de datos antes de generar

## D. Generador RDEP
- [ ] CRUD Empleados (Server Actions + UI)
- [ ] CRUD Ingresos anuales por empleado
- [ ] Constructor XML RDEP compatible con `RDEP.xsd`
- [ ] Validación IA de consistencia (ingresos vs retenciones)
- [ ] Descarga XML funcional
- [ ] UI formulario generación anual

## E. Pre-llenado Formulario 104 (IVA)
- [ ] Consolidador calcula todos los casilleros del 104
- [ ] Ventas gravadas, 0%, exentas, no objeto
- [ ] IVA cobrado y pagado
- [ ] Crédito tributario calculado
- [ ] NC/ND aplicadas a los totales
- [ ] UI vista pre-llenado con formato de casilleros
- [ ] Exportar a Excel/PDF

## F. Pre-llenado Formulario 103 (Retenciones)
- [ ] Consolidador agrupa por código de retención
- [ ] Retenciones de renta por casillero
- [ ] Retenciones de IVA totalizadas
- [ ] UI vista pre-llenado con formato de casilleros
- [ ] Exportar a Excel/PDF

## G. Motor Análisis IA
- [ ] System prompts especializados en tributación ecuatoriana
- [ ] Detección anomalías (facturas sin retención, montos inusuales)
- [ ] Cálculo vencimientos según 9no dígito RUC
- [ ] Alertas de retenciones faltantes
- [ ] Validación cruzada Form 104 vs ATS
- [ ] Proyección tributaria básica (tendencia 3-6 meses)

## H. Chat IA Reportes
- [ ] API route streaming (`/api/reportes/chat/route.js`)
- [ ] System prompt con contexto fiscal del período
- [ ] UI chat reutilizando patrón del wizard factura
- [ ] Respuestas en español, concisas, con datos reales
- [ ] No inventa datos, solo analiza lo existente

## I. Exportación
- [ ] Excel ATS (compras, ventas, anulados, resumen)
- [ ] Excel Form 104 pre-llenado
- [ ] Excel Form 103 pre-llenado
- [ ] PDF resumen reportes
- [ ] PDF reporte de ventas
- [ ] Guardado en Supabase Storage bucket `reportes`

## J. Integración
- [ ] Hub `/reportes/page.js` actualizado con links funcionales
- [ ] Catálogos ATS completos (`ats-catalogo.js`)
- [ ] Calendario vencimientos funcional
- [ ] `npm run build` exitoso sin errores
- [ ] Deploy staging exitoso
- [ ] Tests unitarios consolidadores
- [ ] Tests unitarios constructores XML
- [ ] Tests integración generación completa ATS/RDEP

---

# 16. RESUMEN EJECUTIVO

La **Fase 5** transforma facturIA de un emisor de comprobantes electrónicos en una **plataforma de inteligencia tributaria**. Los 7 entregables se construyen sobre la infraestructura existente (Gemini IA, jsPDF, Supabase, Glass UI) y añaden la capa de reportes que más valor genera al usuario:

- **ATS automático** elimina horas de trabajo manual en el DIMM
- **RDEP automático** simplifica la obligación anual de nómina
- **Pre-llenado 104/103** reduce errores en declaraciones mensuales
- **IA tributaria** detecta problemas antes de que se conviertan en multas
- **Chat IA** permite al usuario consultar sus datos fiscales en lenguaje natural

**Duración:** 15 días hábiles (3 semanas)  
**Archivos nuevos:** ~30  
**Tablas BD nuevas:** 5  
**Dependencia NPM nueva:** 1 (`xlsx`)  
**Reutilización infraestructura:** ~60%
