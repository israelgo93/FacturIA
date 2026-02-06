# facturIA — Fase 3: Motor de Facturación Electrónica
## Plan de Implementación Detallado con Subagentes, Skills e IA Gemini 3 Flash

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 3 — Motor de Facturación (Semanas 6-9, 20 días hábiles)  
**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Cloud Run  
**IA:** Google Gemini 3 Flash (`gemini-3-flash-preview`) via Vercel AI SDK + Google GenAI SDK  
**Fecha:** Febrero 2026

---

# ESTADO ACTUAL — Dependencias de Fase 1 y Fase 2

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

## Subagentes y Skills disponibles (implementados en Fase 2)

### Subagentes Cursor

| SubAgente | Rol | Tools | Uso en Fase 3 |
|---|---|---|---|
| `repo-scout` | Exploración del codebase, búsqueda de archivos | Read, Grep, Glob | Análisis de dependencias antes de cada módulo |
| `sri-validator` | Validación XML SRI, clave de acceso, catálogos | Read, Grep, Terminal | Validación de XML generados, clave de acceso, firma |
| `test-writer` | Generación de tests unitarios, integración, E2E | Read, Edit, Terminal | Tests para cada módulo del motor |
| `db-migrator` | Migraciones SQL, políticas RLS, verificación schema | Read, Edit, Terminal | Tablas de comprobantes, secuenciales, log SRI |

### Skills Cursor

| Skill | Propósito | Uso en Fase 3 |
|---|---|---|
| `supabase-rls` | Patrones RLS multi-tenant | Tablas comprobantes, detalles, impuestos, log SRI |
| `xml-sri` | Generación XML comprobantes electrónicos | XML Builder factura v1.1.0 / v2.1.0 |
| `glass-ui` | Sistema de diseño con soporte de temas | Wizard factura, timeline comprobante, RIDE preview |
| `nextjs-patterns` | Patrones Next.js 16+ con App Router | Server Actions, API Routes, streaming |
| `ci-cd-cloudrun` | CI/CD GitHub Actions → Cloud Run | Deploy con nuevas dependencias |

---

# 1. VISIÓN GENERAL DE LA FASE 3

## 1.1 Objetivo

Implementar el **motor completo de facturación electrónica** que permite crear, firmar, enviar, autorizar y entregar facturas electrónicas autorizadas por el SRI del Ecuador, con asistencia de IA (Gemini 3 Flash) en el wizard de creación.

## 1.2 Flujo del Comprobante Electrónico

```
1. CREAR          2. FIRMAR           3. ENVIAR          4. AUTORIZAR         5. ENTREGAR
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Usuario  │    │ Generar  │    │ WS Recepción │    │ WS Autoriz.  │    │ Enviar email │
│ crea el  │───▶│ XML +    │───▶│ SRI          │───▶│ SRI          │───▶│ con XML +    │
│ compro-  │    │ Firmar   │    │              │    │              │    │ RIDE PDF     │
│ bante    │    │ XAdES    │    │ RECIBIDA /   │    │ AUT / NAT /  │    │              │
└─────────┘    └──────────┘    │ DEVUELTA     │    │ PPR          │    └──────────────┘
                               └──────────────┘    └──────────────┘
```

## 1.3 Estados del Comprobante

| Estado | Código | Descripción |
|---|---|---|
| BORRADOR | `draft` | Creado, no procesado |
| FIRMADO | `signed` | XML generado y firmado con XAdES-BES |
| ENVIADO | `sent` | Enviado al WS Recepción SRI |
| EN_PROCESAMIENTO | `PPR` | SRI procesando (hasta 24h) |
| AUTORIZADO | `AUT` | SRI autorizó el comprobante |
| NO_AUTORIZADO | `NAT` | SRI rechazó, requiere corrección |
| DEVUELTO | `DEV` | Error en recepción (XML inválido) |
| ANULADO | `voided` | Anulado por el usuario |

## 1.4 Entregables de la Fase 3

| # | Entregable | Criterio de Aceptación |
|---|---|---|
| 1 | Generador clave de acceso | 49 dígitos + Módulo 11, tests con vectores reales SRI |
| 2 | XML Builder factura | XML v1.1.0 / v2.1.0 válido según XSD del SRI |
| 3 | Firma XAdES-BES | XML firmado con .p12, validable por SRI |
| 4 | Cliente SOAP SRI | Comunicación con WS Recepción y Autorización (pruebas + producción) |
| 5 | Flujo completo orquestado | BORRADOR → FIRMADO → ENVIADO → AUTORIZADO |
| 6 | RIDE PDF | Representación impresa conforme formato SRI |
| 7 | Email automático | Envío XML autorizado + RIDE PDF al cliente |
| 8 | Wizard factura con IA | Formulario paso a paso con asistencia Gemini 3 Flash |
| 9 | Listado comprobantes | Tabla con filtros, estados, acciones |
| 10 | Tests completos | Unit + Integration + E2E para todo el motor |

---

# 2. ACTUALIZACIÓN DEL STACK DE IA — MIGRACIÓN A GEMINI 3 FLASH

## 2.1 Estado Actual de Modelos Gemini (Febrero 2026)

| Modelo | Estado | Model String | Uso Recomendado |
|---|---|---|---|
| ~~Gemini 2.0 Flash~~ | **DEPRECATED** (shutdown 31 mar 2026) | ~~gemini-2.0-flash~~ | ❌ No usar |
| Gemini 2.5 Flash | Stable (GA) | `gemini-2.5-flash` | ✅ Fallback económico |
| **Gemini 3 Flash** | **Preview (Recomendado)** | `gemini-3-flash-preview` | ✅ **Modelo principal** |
| Gemini 3 Pro | Preview | `gemini-3-pro-preview` | Tareas complejas |

**Decisión:** Migrar de `gemini-2.0-flash` a `gemini-3-flash-preview` como modelo principal, con fallback a `gemini-2.5-flash` para estabilidad.

## 2.2 Migración de SDKs

### SDK Anterior (Fase 2 — DEPRECADO)

```javascript
// ❌ @google/generative-ai — LEGACY, NO USAR
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

### SDK Nuevo — Opción A: Google GenAI SDK (Llamadas directas)

```bash
npm install @google/genai@latest  # v1.40.0+
```

```javascript
// ✅ @google/genai — SDK OFICIAL UNIFICADO 2026
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generación simple
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Analiza este RUC: 1790016919001',
});
console.log(response.text);

// Streaming
const stream = await ai.models.generateContentStream({
  model: 'gemini-3-flash-preview',
  contents: 'Explica las tarifas de IVA en Ecuador',
  config: {
    thinkingConfig: {
      thinkingLevel: 'low', // minimal | low | medium | high
    },
  },
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text || '');
}
```

### SDK Nuevo — Opción B: Vercel AI SDK con Google Provider (RECOMENDADO para Next.js)

```bash
npm install ai@latest @ai-sdk/google@latest  # AI SDK v6+
```

```javascript
// ✅ Vercel AI SDK — IDEAL para Next.js (streaming, useChat, Server Actions)
import { google } from '@ai-sdk/google';
import { streamText, generateText, generateObject } from 'ai';

// En API Route (src/app/api/ia/factura/route.js)
export async function POST(req) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-3-flash-preview', {
      thinkingLevel: 'low',  // Control de profundidad de razonamiento
    }),
    system: `Eres el asistente de facturación de facturIA. 
      Conoces la normativa tributaria ecuatoriana...`,
    messages,
  });

  return result.toDataStreamResponse();
}

// En componente React (useChat hook)
'use client';
import { useChat } from '@ai-sdk/react';

export function WizardFacturaIA() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ia/factura',
  });
  // ...
}
```

## 2.3 Decisión de Arquitectura de IA para Fase 3

**Estrategia híbrida — Usar ambos SDKs según el caso de uso:**

| Caso de Uso | SDK | Razón |
|---|---|---|
| Wizard factura (chat interactivo) | **Vercel AI SDK** (`@ai-sdk/google`) | Streaming nativo, `useChat`, integración Next.js |
| Validación XML con IA | **Google GenAI SDK** (`@google/genai`) | `generateObject` con schema Zod, sin UI |
| Sugerencias de productos | **Vercel AI SDK** | Streaming parcial, UX fluida |
| Análisis de errores SRI | **Google GenAI SDK** | Procesamiento batch server-side |
| Pre-llenado inteligente | **Vercel AI SDK** | `generateObject` con structured output |

### Archivo: `src/lib/ia/gemini-client.js` (Actualizado)

```javascript
// Migración del cliente Gemini para Fase 3
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Modelo principal: Gemini 3 Flash
const PRIMARY_MODEL = 'gemini-3-flash-preview';
// Fallback: Gemini 2.5 Flash (estable, GA)
const FALLBACK_MODEL = 'gemini-2.5-flash';

/**
 * Genera contenido con fallback automático
 */
export async function generateWithFallback(options) {
  try {
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      ...options,
    });
  } catch (error) {
    console.warn(`Gemini 3 Flash falló, usando fallback: ${error.message}`);
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      ...options,
    });
  }
}

/**
 * Genera contenido estructurado (JSON) con schema
 */
export async function generateStructured(prompt, schema) {
  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });
  return JSON.parse(response.text);
}

/**
 * Stream de contenido para UI
 */
export async function* streamContent(options) {
  const stream = await ai.models.generateContentStream({
    model: PRIMARY_MODEL,
    ...options,
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

export { ai, PRIMARY_MODEL, FALLBACK_MODEL };
```

### Actualización de `package.json`

```json
{
  "dependencies": {
    "@google/genai": "^1.40.0",
    "ai": "^6.0.0",
    "@ai-sdk/google": "^1.2.23",
    "fast-xml-parser": "^4.5.0",
    "node-forge": "^1.3.1",
    "xml-crypto": "^6.0.0",
    "soap": "^1.1.0",
    "@react-pdf/renderer": "^4.0.0",
    "pdf-lib": "^1.17.1",
    "resend": "^4.0.0",
    "zod": "^3.23.0"
  }
}
```

### Variable de Entorno

```bash
# Renombrar si es necesario para compatibilidad con Vercel AI SDK
GOOGLE_GENERATIVE_AI_API_KEY=AIza...   # Vercel AI SDK busca esta variable
GEMINI_API_KEY=AIza...                  # Google GenAI SDK busca esta variable
```

---

# 3. ARQUITECTURA DEL MOTOR DE FACTURACIÓN

## 3.1 Estructura de Archivos Fase 3

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── comprobantes/
│   │   │   ├── page.js                      → Lista comprobantes con filtros
│   │   │   ├── actions.js                   → Server Actions (crear, anular, reenviar)
│   │   │   ├── nuevo/
│   │   │   │   └── page.js                  → Wizard factura (pasos)
│   │   │   ├── [id]/
│   │   │   │   ├── page.js                  → Detalle comprobante
│   │   │   │   └── ride/page.js             → Preview RIDE PDF
│   │   │   └── loading.js                   → Skeleton loading
│   │   └── ...
│   └── api/
│       ├── ia/
│       │   ├── factura-wizard/route.js       → Chat IA wizard (Vercel AI SDK)
│       │   ├── sugerir-productos/route.js    → Sugerencias productos
│       │   └── analizar-error-sri/route.js   → Análisis errores SRI con IA
│       ├── sri/
│       │   ├── enviar/route.js               → Envío a WS Recepción
│       │   ├── autorizar/route.js            → Consulta WS Autorización
│       │   └── webhook/route.js              → Webhook para polling autorización
│       └── comprobantes/
│           ├── ride/[id]/route.js            → Generación RIDE PDF
│           └── email/[id]/route.js           → Envío email con XML + RIDE
│
├── lib/
│   ├── sri/                                  → ☆ MOTOR SRI (Core)
│   │   ├── clave-acceso.js                   → Generador clave 49 dígitos + Módulo 11
│   │   ├── xml-builder.js                    → Construcción XML por tipo de comprobante
│   │   ├── xml-signer.js                     → Firma XAdES-BES con .p12
│   │   ├── soap-client.js                    → Cliente SOAP WS SRI
│   │   ├── ride-generator.js                 → Generador RIDE PDF
│   │   ├── comprobante-orchestrator.js       → Orquestador del flujo completo
│   │   ├── secuencial-manager.js             → Gestión secuenciales por empresa
│   │   ├── catalogs.js                       → Catálogos SRI (ya existente, extender)
│   │   └── validators.js                     → Validaciones específicas factura
│   ├── ia/
│   │   ├── gemini-client.js                  → Cliente Gemini actualizado (v3 Flash)
│   │   ├── factura-prompts.js                → System prompts wizard factura
│   │   ├── error-analyzer.js                 → Análisis de errores SRI con IA
│   │   └── product-suggester.js              → Sugerencias inteligentes
│   ├── email/
│   │   └── resend-client.js                  → Cliente Resend para envío email
│   └── crypto/
│       └── p12-manager.js                    → Gestión certificados (ya existente)
│
├── components/
│   ├── comprobantes/
│   │   ├── ComprobanteList.jsx               → Tabla con filtros y estados
│   │   ├── ComprobanteCard.jsx               → Card resumen mobile
│   │   ├── ComprobanteTimeline.jsx           → Timeline de estados
│   │   ├── RIDEPreview.jsx                   → Vista previa RIDE
│   │   ├── ComprobanteActions.jsx            → Acciones (firmar, enviar, anular)
│   │   └── StatusBadge.jsx                   → Badge de estado con colores
│   ├── wizard/
│   │   ├── WizardFactura.jsx                 → Wizard principal (pasos)
│   │   ├── StepCliente.jsx                   → Paso 1: Seleccionar cliente
│   │   ├── StepDetalles.jsx                  → Paso 2: Agregar productos/servicios
│   │   ├── StepPagos.jsx                     → Paso 3: Formas de pago
│   │   ├── StepResumen.jsx                   → Paso 4: Resumen + preview
│   │   ├── StepConfirmacion.jsx              → Paso 5: Confirmar y procesar
│   │   ├── IAAssistant.jsx                   → Panel lateral IA (chat)
│   │   └── ProductSearchIA.jsx              → Búsqueda productos con IA
│   └── pdf/
│       └── RIDETemplate.jsx                  → Template React PDF para RIDE
│
├── stores/
│   └── useComprobanteStore.js                → Estado global del wizard + comprobantes
│
└── hooks/
    ├── useFacturaWizard.js                   → Hook wizard con validación por paso
    ├── useComprobanteActions.js              → Hook para acciones CRUD
    └── useSRIStatus.js                       → Hook polling estado SRI (realtime)

supabase/migrations/
├── 004_comprobantes.sql                      → Tabla comprobantes + detalles + impuestos
├── 005_secuenciales.sql                      → Secuenciales por empresa + establecimiento
└── 006_sri_log.sql                           → Log de comunicación con WS SRI

tests/
├── unit/
│   ├── sri/
│   │   ├── clave-acceso.test.js              → Vectores de prueba Módulo 11
│   │   ├── xml-builder.test.js               → Validación estructura XML
│   │   ├── xml-signer.test.js                → Firma XAdES verificable
│   │   └── secuencial.test.js                → Secuenciales concurrentes
│   └── ia/
│       └── factura-prompts.test.js           → Respuestas IA esperadas
├── integration/
│   ├── comprobante-flow.test.js              → Flujo completo CRUD
│   ├── sri-soap.test.js                      → WS SRI ambiente pruebas
│   └── ride-generator.test.js                → RIDE PDF genera correctamente
└── e2e/
    ├── crear-factura.spec.js                 → Wizard completo → autorizada
    └── listado-comprobantes.spec.js           → Filtros, búsqueda, acciones
```

## 3.2 Migración de Base de Datos

### Migración `004_comprobantes.sql`

**SubAgente:** `db-migrator` + Skill `supabase-rls`

```sql
-- ==============================================
-- TABLA: comprobantes
-- Motor principal de facturación electrónica
-- ==============================================
CREATE TABLE IF NOT EXISTS comprobantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id),
  
  -- Tipo de comprobante
  tipo_comprobante TEXT NOT NULL DEFAULT '01'
    CHECK (tipo_comprobante IN ('01','04','05','06','07','08')),
  -- 01=Factura, 04=NC, 05=ND, 06=GR, 07=Ret, 08=LiqCompra
  
  -- Numeración
  secuencial TEXT NOT NULL,  -- 000000001 (9 dígitos)
  numero_completo TEXT NOT NULL, -- 001-001-000000001
  
  -- Clave de acceso y autorización
  clave_acceso TEXT UNIQUE, -- 49 dígitos (generado)
  numero_autorizacion TEXT, -- Igual a clave_acceso cuando es AUTORIZADO
  fecha_autorizacion TIMESTAMPTZ,
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'draft'
    CHECK (estado IN ('draft','signed','sent','PPR','AUT','NAT','DEV','voided')),
  
  -- Comprador
  cliente_id UUID REFERENCES clientes(id),
  tipo_identificacion_comprador TEXT NOT NULL,
  identificacion_comprador TEXT NOT NULL,
  razon_social_comprador TEXT NOT NULL,
  direccion_comprador TEXT,
  email_comprador TEXT,
  telefono_comprador TEXT,
  
  -- Totales
  subtotal_sin_impuestos DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal_iva_0 DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal_no_objeto DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal_exento DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_iva DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_ice DECIMAL(14,2) NOT NULL DEFAULT 0,
  propina DECIMAL(14,2) NOT NULL DEFAULT 0,
  importe_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'DOLAR',
  
  -- Fechas
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- XML
  xml_sin_firma TEXT,      -- XML generado (sin firma)
  xml_firmado TEXT,         -- XML con firma XAdES-BES
  xml_autorizado TEXT,      -- XML devuelto por SRI
  
  -- Metadata
  ambiente TEXT NOT NULL DEFAULT '1' CHECK (ambiente IN ('1','2')),
  tipo_emision TEXT NOT NULL DEFAULT '1' CHECK (tipo_emision IN ('1')),
  observaciones TEXT,
  
  -- Información adicional (JSON)
  info_adicional JSONB DEFAULT '[]',
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Referencia a documento modificado (NC, ND)
  comprobante_referencia_id UUID REFERENCES comprobantes(id),
  
  -- Restricción de unicidad
  UNIQUE(empresa_id, tipo_comprobante, numero_completo)
);

-- RLS
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON comprobantes
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));
CREATE POLICY "Insertar propios" ON comprobantes
  FOR INSERT WITH CHECK (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));
CREATE POLICY "Actualizar propios" ON comprobantes
  FOR UPDATE USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_estado ON comprobantes(empresa_id, estado);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(empresa_id, fecha_emision DESC);
CREATE INDEX idx_comprobantes_clave ON comprobantes(clave_acceso);
CREATE INDEX idx_comprobantes_cliente ON comprobantes(empresa_id, cliente_id);
CREATE INDEX idx_comprobantes_tipo_fecha ON comprobantes(empresa_id, tipo_comprobante, fecha_emision DESC);

-- Trigger updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON comprobantes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- TABLA: comprobante_detalles
-- Líneas de detalle del comprobante
-- ==============================================
CREATE TABLE IF NOT EXISTS comprobante_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  
  -- Producto
  producto_id UUID REFERENCES productos(id),
  codigo_principal TEXT NOT NULL,
  codigo_auxiliar TEXT,
  descripcion TEXT NOT NULL,
  
  -- Cantidades
  cantidad DECIMAL(14,6) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(14,6) NOT NULL,
  descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
  precio_total_sin_impuesto DECIMAL(14,2) NOT NULL,
  
  -- Detalles adicionales (JSON array)
  detalles_adicionales JSONB DEFAULT '[]',
  
  -- Orden
  orden INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE comprobante_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso via comprobante" ON comprobante_detalles
  USING (comprobante_id IN (
    SELECT id FROM comprobantes WHERE empresa_id = (
      SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()
    )
  ));

CREATE INDEX idx_detalles_comprobante ON comprobante_detalles(comprobante_id);

-- ==============================================
-- TABLA: comprobante_impuestos
-- Impuestos por línea de detalle
-- ==============================================
CREATE TABLE IF NOT EXISTS comprobante_impuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_detalle_id UUID NOT NULL REFERENCES comprobante_detalles(id) ON DELETE CASCADE,
  
  -- Impuesto (Tabla 16 SRI)
  codigo TEXT NOT NULL, -- 2=IVA, 3=ICE, 5=IRBPNR
  codigo_porcentaje TEXT NOT NULL, -- Tabla 17 para IVA, Tabla 18 para ICE
  tarifa DECIMAL(5,2) NOT NULL, -- Porcentaje (0, 5, 12, 13, 14, 15)
  base_imponible DECIMAL(14,2) NOT NULL,
  valor DECIMAL(14,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE comprobante_impuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso via detalle" ON comprobante_impuestos
  USING (comprobante_detalle_id IN (
    SELECT cd.id FROM comprobante_detalles cd
    JOIN comprobantes c ON cd.comprobante_id = c.id
    WHERE c.empresa_id = (
      SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()
    )
  ));

CREATE INDEX idx_impuestos_detalle ON comprobante_impuestos(comprobante_detalle_id);

-- ==============================================
-- TABLA: comprobante_pagos
-- Formas de pago del comprobante
-- ==============================================
CREATE TABLE IF NOT EXISTS comprobante_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  
  forma_pago TEXT NOT NULL, -- Tabla 24 SRI (01, 15, 16, 17, 18, 19, 20, 21)
  total DECIMAL(14,2) NOT NULL,
  plazo INTEGER, -- Días
  unidad_tiempo TEXT DEFAULT 'dias',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE comprobante_pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso via comprobante" ON comprobante_pagos
  USING (comprobante_id IN (
    SELECT id FROM comprobantes WHERE empresa_id = (
      SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()
    )
  ));

CREATE INDEX idx_pagos_comprobante ON comprobante_pagos(comprobante_id);
```

### Migración `005_secuenciales.sql`

```sql
-- ==============================================
-- TABLA: secuenciales
-- Control de secuenciales por empresa, establecimiento, punto y tipo
-- ==============================================
CREATE TABLE IF NOT EXISTS secuenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id),
  tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('01','04','05','06','07','08')),
  
  ultimo_secuencial INTEGER NOT NULL DEFAULT 0,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante)
);

ALTER TABLE secuenciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON secuenciales
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- Función atómica para obtener siguiente secuencial
CREATE OR REPLACE FUNCTION next_secuencial(
  p_empresa_id UUID,
  p_establecimiento_id UUID,
  p_punto_emision_id UUID,
  p_tipo_comprobante TEXT
) RETURNS TEXT AS $$
DECLARE
  v_secuencial INTEGER;
BEGIN
  INSERT INTO secuenciales (empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante, ultimo_secuencial)
  VALUES (p_empresa_id, p_establecimiento_id, p_punto_emision_id, p_tipo_comprobante, 1)
  ON CONFLICT (empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante)
  DO UPDATE SET 
    ultimo_secuencial = secuenciales.ultimo_secuencial + 1,
    updated_at = now()
  RETURNING ultimo_secuencial INTO v_secuencial;
  
  RETURN LPAD(v_secuencial::TEXT, 9, '0');
END;
$$ LANGUAGE plpgsql;
```

### Migración `006_sri_log.sql`

```sql
-- ==============================================
-- TABLA: sri_log
-- Log de toda comunicación con WS del SRI
-- ==============================================
CREATE TABLE IF NOT EXISTS sri_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  comprobante_id UUID REFERENCES comprobantes(id),
  
  -- Tipo de operación
  operacion TEXT NOT NULL CHECK (operacion IN ('recepcion','autorizacion')),
  
  -- Request
  ws_url TEXT NOT NULL,
  xml_enviado TEXT,
  
  -- Response
  estado_respuesta TEXT, -- RECIBIDA, DEVUELTA, AUTORIZADO, NO AUTORIZADO, EN PROCESAMIENTO
  xml_respuesta TEXT,
  mensajes JSONB, -- Array de mensajes de error/advertencia del SRI
  
  -- Metadata
  tiempo_respuesta_ms INTEGER,
  intentos INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sri_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON sri_log
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

CREATE INDEX idx_sri_log_comprobante ON sri_log(comprobante_id);
CREATE INDEX idx_sri_log_empresa_fecha ON sri_log(empresa_id, created_at DESC);
```

---

# 4. MÓDULOS DEL MOTOR — IMPLEMENTACIÓN DETALLADA

## 4.1 Módulo: Generador de Clave de Acceso (49 dígitos)

**SubAgente:** `sri-validator` + Skill `xml-sri`

### Estructura de la Clave de Acceso

```
Posición:  [1-8]    [9-10]  [11-23]       [24]   [25-27] [28-30] [31-39]         [40-47]    [48]      [49]
Contenido: Fecha    TipDoc  RUC           Amb    Estab   PtoEmi  Secuencial      CódNum     TipoEm    Dígito
           ddmmaaaa  01      1790012345001  1     001     001     000000001       12345678    1         Mod11
```

### Archivo: `src/lib/sri/clave-acceso.js`

```javascript
/**
 * Generador de Clave de Acceso para comprobantes electrónicos SRI
 * Ficha Técnica: Tabla 1 — Estructura Clave de Acceso
 * 
 * SubAgente: sri-validator
 * Skill: xml-sri
 */

/**
 * Genera los 49 dígitos de la clave de acceso
 * @param {Object} params
 * @param {Date} params.fechaEmision - Fecha de emisión
 * @param {string} params.tipoComprobante - Código tipo (01=Factura, 04=NC, etc.)
 * @param {string} params.ruc - RUC del emisor (13 dígitos)
 * @param {string} params.ambiente - 1=Pruebas, 2=Producción
 * @param {string} params.establecimiento - Código establecimiento (3 dígitos)
 * @param {string} params.puntoEmision - Código punto emisión (3 dígitos)
 * @param {string} params.secuencial - Secuencial (9 dígitos)
 * @param {string} params.tipoEmision - 1=Normal
 * @returns {string} Clave de acceso de 49 dígitos
 */
export function generarClaveAcceso({
  fechaEmision,
  tipoComprobante,
  ruc,
  ambiente,
  establecimiento,
  puntoEmision,
  secuencial,
  tipoEmision = '1',
}) {
  // Formatear fecha ddmmaaaa
  const fecha = formatearFecha(fechaEmision);
  
  // Generar código numérico aleatorio (8 dígitos)
  const codigoNumerico = generarCodigoNumerico();
  
  // Construir los primeros 48 dígitos
  const clave48 = [
    fecha,            // 8 dígitos
    tipoComprobante,  // 2 dígitos
    ruc,              // 13 dígitos
    ambiente,         // 1 dígito
    establecimiento,  // 3 dígitos
    puntoEmision,     // 3 dígitos
    secuencial,       // 9 dígitos
    codigoNumerico,   // 8 dígitos
    tipoEmision,      // 1 dígito
  ].join('');
  
  if (clave48.length !== 48) {
    throw new Error(`Clave debe tener 48 dígitos antes del verificador, tiene ${clave48.length}`);
  }
  
  // Calcular dígito verificador Módulo 11
  const digitoVerificador = calcularModulo11(clave48);
  
  return clave48 + digitoVerificador;
}

/**
 * Algoritmo Módulo 11 según Ficha Técnica SRI
 * Factores: 2,3,4,5,6,7 (cíclico de derecha a izquierda)
 */
export function calcularModulo11(cadena) {
  const factores = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  
  // Recorrer de derecha a izquierda
  for (let i = cadena.length - 1, j = 0; i >= 0; i--, j++) {
    suma += parseInt(cadena[i]) * factores[j % 6];
  }
  
  const residuo = suma % 11;
  let digito = 11 - residuo;
  
  if (digito === 11) digito = 0;
  if (digito === 10) digito = 1;
  
  return digito.toString();
}

function formatearFecha(fecha) {
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = String(d.getFullYear());
  return dd + mm + aaaa;
}

function generarCodigoNumerico() {
  return String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
}

/**
 * Valida una clave de acceso existente
 */
export function validarClaveAcceso(clave) {
  if (!/^\d{49}$/.test(clave)) return { valid: false, error: 'Debe tener 49 dígitos numéricos' };
  
  const clave48 = clave.substring(0, 48);
  const digitoEsperado = calcularModulo11(clave48);
  
  if (clave[48] !== digitoEsperado) {
    return { valid: false, error: `Dígito verificador inválido. Esperado: ${digitoEsperado}, Recibido: ${clave[48]}` };
  }
  
  return { valid: true };
}
```

## 4.2 Módulo: XML Builder (Factura v1.1.0)

**SubAgente:** `sri-validator` + Skill `xml-sri`

### Archivo: `src/lib/sri/xml-builder.js`

```javascript
/**
 * Constructor de XML para comprobantes electrónicos
 * Basado en Ficha Técnica SRI — Anexo 3 (v1.1.0)
 * 
 * SubAgente: sri-validator
 * Skill: xml-sri
 */
import { XMLBuilder } from 'fast-xml-parser';

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
  processEntities: false,
});

/**
 * Construye el XML de una factura electrónica v1.1.0
 */
export function buildFacturaXML(factura) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    factura: {
      '@_id': 'comprobante',
      '@_version': '1.1.0',
      infoTributaria: buildInfoTributaria(factura),
      infoFactura: buildInfoFactura(factura),
      detalles: {
        detalle: factura.detalles.map(buildDetalle),
      },
    },
  };

  // Info adicional (opcional)
  if (factura.infoAdicional && factura.infoAdicional.length > 0) {
    xmlObj.factura.infoAdicional = {
      campoAdicional: factura.infoAdicional.map(campo => ({
        '@_nombre': campo.nombre,
        '#text': campo.valor,
      })),
    };
  }

  // Formas de pago
  if (factura.pagos && factura.pagos.length > 0) {
    xmlObj.factura.infoFactura.pagos = {
      pago: factura.pagos.map(pago => ({
        formaPago: pago.formaPago,
        total: pago.total.toFixed(2),
        ...(pago.plazo && { plazo: pago.plazo }),
        ...(pago.unidadTiempo && { unidadTiempo: pago.unidadTiempo }),
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}

function buildInfoTributaria(f) {
  return {
    ambiente: f.ambiente,
    tipoEmision: f.tipoEmision || '1',
    razonSocial: f.emisor.razonSocial,
    ...(f.emisor.nombreComercial && { nombreComercial: f.emisor.nombreComercial }),
    ruc: f.emisor.ruc,
    claveAcceso: f.claveAcceso,
    codDoc: f.tipoComprobante,
    estab: f.establecimiento.codigo,
    ptoEmi: f.puntoEmision.codigo,
    secuencial: f.secuencial,
    dirMatriz: f.emisor.direccion,
    ...(f.emisor.agenteRetencion && { agenteRetencion: f.emisor.agenteRetencion }),
    ...(f.emisor.contribuyenteRimpe && { contribuyenteRimpe: f.emisor.contribuyenteRimpe }),
  };
}

function buildInfoFactura(f) {
  return {
    fechaEmision: formatDateSRI(f.fechaEmision),
    ...(f.establecimiento.direccion && { dirEstablecimiento: f.establecimiento.direccion }),
    ...(f.emisor.contribuyenteEspecial && { contribuyenteEspecial: f.emisor.contribuyenteEspecial }),
    obligadoContabilidad: f.emisor.obligadoContabilidad ? 'SI' : 'NO',
    tipoIdentificacionComprador: f.comprador.tipoIdentificacion,
    ...(f.comprador.guiaRemision && { guiaRemision: f.comprador.guiaRemision }),
    razonSocialComprador: f.comprador.razonSocial,
    identificacionComprador: f.comprador.identificacion,
    ...(f.comprador.direccion && { direccionComprador: f.comprador.direccion }),
    totalSinImpuestos: f.totales.totalSinImpuestos.toFixed(2),
    totalDescuento: f.totales.totalDescuento.toFixed(2),
    totalConImpuestos: {
      totalImpuesto: buildTotalImpuestos(f.totales.impuestos),
    },
    propina: (f.totales.propina || 0).toFixed(2),
    importeTotal: f.totales.importeTotal.toFixed(2),
    moneda: f.moneda || 'DOLAR',
  };
}

function buildDetalle(detalle) {
  return {
    codigoPrincipal: detalle.codigoPrincipal,
    ...(detalle.codigoAuxiliar && { codigoAuxiliar: detalle.codigoAuxiliar }),
    descripcion: detalle.descripcion,
    cantidad: detalle.cantidad.toFixed(6),
    precioUnitario: detalle.precioUnitario.toFixed(6),
    descuento: (detalle.descuento || 0).toFixed(2),
    precioTotalSinImpuesto: detalle.precioTotalSinImpuesto.toFixed(2),
    ...(detalle.detallesAdicionales && detalle.detallesAdicionales.length > 0 && {
      detallesAdicionales: {
        detAdicional: detalle.detallesAdicionales.map(d => ({
          '@_nombre': d.nombre,
          '@_valor': d.valor,
        })),
      },
    }),
    impuestos: {
      impuesto: detalle.impuestos.map(imp => ({
        codigo: imp.codigo,
        codigoPorcentaje: imp.codigoPorcentaje,
        tarifa: imp.tarifa.toFixed(2),
        baseImponible: imp.baseImponible.toFixed(2),
        valor: imp.valor.toFixed(2),
      })),
    },
  };
}

function buildTotalImpuestos(impuestos) {
  return impuestos.map(imp => ({
    codigo: imp.codigo,
    codigoPorcentaje: imp.codigoPorcentaje,
    baseImponible: imp.baseImponible.toFixed(2),
    valor: imp.valor.toFixed(2),
  }));
}

function formatDateSRI(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
```

## 4.3 Módulo: Firma XAdES-BES

**SubAgente:** `sri-validator` + Skill `xml-sri`

### Archivo: `src/lib/sri/xml-signer.js`

```javascript
/**
 * Firma electrónica XAdES-BES para comprobantes electrónicos
 * Ficha Técnica SRI — Sección 6: Firma Electrónica
 * 
 * Estándar: XAdES-BES (http://uri.etsi.org/01903/v1.3.2#)
 * Algoritmo: RSA-SHA1
 * Tipo: ENVELOPED
 * Certificado: PKCS#12 (.p12)
 * 
 * SubAgente: sri-validator
 * Skill: xml-sri
 */
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import crypto from 'node:crypto';

/**
 * Firma un XML con certificado .p12
 * @param {string} xmlString - XML sin firmar
 * @param {Buffer} p12Buffer - Contenido del archivo .p12
 * @param {string} p12Password - Contraseña del .p12
 * @returns {string} XML firmado con XAdES-BES
 */
export async function firmarXML(xmlString, p12Buffer, p12Password) {
  // 1. Extraer certificado y clave privada del .p12
  const { certificate, privateKey, certChain } = extraerCredenciales(p12Buffer, p12Password);
  
  // 2. Crear firma XAdES-BES ENVELOPED
  const sig = new SignedXml({
    privateKey: privateKey,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  });

  // Referencia al documento completo (enveloped)
  sig.addReference({
    uri: '#comprobante',
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
    ],
  });

  // KeyInfo con certificado X.509
  sig.keyInfoProvider = {
    getKeyInfo: () => {
      const certBase64 = forge.util.encode64(
        forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes()
      );
      return `<KeyInfo>
        <X509Data>
          <X509Certificate>${certBase64}</X509Certificate>
        </X509Data>
      </KeyInfo>`;
    },
  };

  // Computar firma
  sig.computeSignature(xmlString, {
    location: { reference: '/*', action: 'append' },
  });

  return sig.getSignedXml();
}

/**
 * Extrae certificado y clave privada de un archivo .p12
 */
function extraerCredenciales(p12Buffer, password) {
  const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  
  // Buscar clave privada
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag) throw new Error('No se encontró clave privada en el .p12');
  
  // Buscar certificado
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag) throw new Error('No se encontró certificado en el .p12');
  
  // Convertir clave privada a PEM para xml-crypto
  const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
  
  return {
    certificate: certBag.cert,
    privateKey: privateKeyPem,
    certChain: certBags[forge.pki.oids.certBag].map(b => b.cert),
  };
}
```

## 4.4 Módulo: Cliente SOAP SRI

**SubAgente:** `sri-validator` + Skill `xml-sri`

### Archivo: `src/lib/sri/soap-client.js`

```javascript
/**
 * Cliente SOAP para Web Services del SRI
 * WS Recepción: Envío de comprobantes
 * WS Autorización: Consulta de autorización
 * 
 * SubAgente: sri-validator
 * Skill: xml-sri
 */
import soap from 'soap';

// URLs Web Services SRI
const WS_URLS = {
  pruebas: {
    recepcion: process.env.SRI_WS_RECEPCION_PRUEBAS,
    autorizacion: process.env.SRI_WS_AUTORIZACION_PRUEBAS,
  },
  produccion: {
    recepcion: process.env.SRI_WS_RECEPCION_PROD,
    autorizacion: process.env.SRI_WS_AUTORIZACION_PROD,
  },
};

/**
 * Envía un comprobante firmado al WS de Recepción del SRI
 * @param {string} xmlFirmado - XML firmado con XAdES-BES
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Object} { estado, comprobantes, mensajes }
 */
export async function enviarComprobante(xmlFirmado, ambiente = '1') {
  const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
  const startTime = Date.now();
  
  try {
    const client = await soap.createClientAsync(urls.recepcion);
    
    // Convertir XML a Base64 para el WS
    const xmlBase64 = Buffer.from(xmlFirmado, 'utf-8').toString('base64');
    
    const [result] = await client.validarComprobanteAsync({
      xml: xmlBase64,
    });
    
    const tiempoMs = Date.now() - startTime;
    
    return {
      estado: result?.RespuestaRecepcionComprobante?.estado || 'ERROR',
      comprobantes: result?.RespuestaRecepcionComprobante?.comprobantes?.comprobante || [],
      mensajes: extraerMensajes(result),
      tiempoMs,
    };
  } catch (error) {
    return {
      estado: 'ERROR_CONEXION',
      comprobantes: [],
      mensajes: [{ tipo: 'ERROR', mensaje: error.message }],
      tiempoMs: Date.now() - startTime,
    };
  }
}

/**
 * Consulta la autorización de un comprobante por clave de acceso
 * @param {string} claveAcceso - Clave de acceso de 49 dígitos
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Object} { estado, numeroAutorizacion, fechaAutorizacion, xmlAutorizado, mensajes }
 */
export async function consultarAutorizacion(claveAcceso, ambiente = '1') {
  const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
  const startTime = Date.now();
  
  try {
    const client = await soap.createClientAsync(urls.autorizacion);
    
    const [result] = await client.autorizacionComprobanteAsync({
      claveAccesoComprobante: claveAcceso,
    });
    
    const autorizacion = result?.RespuestaAutorizacionComprobante
      ?.autorizaciones?.autorizacion?.[0];
    
    const tiempoMs = Date.now() - startTime;
    
    if (!autorizacion) {
      return {
        estado: 'SIN_RESPUESTA',
        mensajes: [{ tipo: 'ERROR', mensaje: 'No se obtuvo respuesta del SRI' }],
        tiempoMs,
      };
    }
    
    return {
      estado: autorizacion.estado, // AUTORIZADO, NO AUTORIZADO, EN PROCESAMIENTO
      numeroAutorizacion: autorizacion.numeroAutorizacion,
      fechaAutorizacion: autorizacion.fechaAutorizacion,
      xmlAutorizado: autorizacion.comprobante,
      mensajes: autorizacion.mensajes?.mensaje || [],
      tiempoMs,
    };
  } catch (error) {
    return {
      estado: 'ERROR_CONEXION',
      mensajes: [{ tipo: 'ERROR', mensaje: error.message }],
      tiempoMs: Date.now() - startTime,
    };
  }
}

function extraerMensajes(result) {
  const comprobantes = result?.RespuestaRecepcionComprobante?.comprobantes?.comprobante;
  if (!comprobantes) return [];
  
  const msgs = [];
  const comps = Array.isArray(comprobantes) ? comprobantes : [comprobantes];
  
  for (const comp of comps) {
    const mensajes = comp?.mensajes?.mensaje;
    if (mensajes) {
      const msgArr = Array.isArray(mensajes) ? mensajes : [mensajes];
      msgs.push(...msgArr.map(m => ({
        tipo: m.tipo,
        codigo: m.identificador,
        mensaje: m.mensaje,
        informacionAdicional: m.informacionAdicional,
      })));
    }
  }
  
  return msgs;
}
```

## 4.5 Módulo: Orquestador del Flujo Completo

**SubAgente:** `repo-scout` (análisis) + `sri-validator` (validación)

### Archivo: `src/lib/sri/comprobante-orchestrator.js`

```javascript
/**
 * Orquestador del flujo completo de facturación electrónica
 * BORRADOR → FIRMADO → ENVIADO → AUTORIZADO
 * 
 * SubAgente: sri-validator
 * Skill: xml-sri + supabase-rls
 */
import { generarClaveAcceso } from './clave-acceso';
import { buildFacturaXML } from './xml-builder';
import { firmarXML } from './xml-signer';
import { enviarComprobante, consultarAutorizacion } from './soap-client';
import { createClient } from '@/lib/supabase/server';

const MAX_REINTENTOS_AUTORIZACION = 5;
const DELAY_REINTENTO_MS = 3000;

/**
 * Procesa un comprobante completo: Firma → Envío → Autorización
 */
export async function procesarComprobante(comprobanteId) {
  const supabase = await createClient();
  
  // 1. Obtener comprobante con todos sus datos
  const comprobante = await obtenerComprobanteCompleto(supabase, comprobanteId);
  if (!comprobante) throw new Error('Comprobante no encontrado');
  if (comprobante.estado !== 'draft') throw new Error(`Estado inválido: ${comprobante.estado}`);
  
  try {
    // 2. Generar clave de acceso
    const claveAcceso = generarClaveAcceso({
      fechaEmision: comprobante.fecha_emision,
      tipoComprobante: comprobante.tipo_comprobante,
      ruc: comprobante.empresa.ruc,
      ambiente: comprobante.ambiente,
      establecimiento: comprobante.establecimiento.codigo,
      puntoEmision: comprobante.punto_emision.codigo,
      secuencial: comprobante.secuencial,
    });
    
    // 3. Construir XML
    const xmlData = prepararDatosXML(comprobante, claveAcceso);
    const xmlSinFirma = buildFacturaXML(xmlData);
    
    // 4. Firmar XML
    const { p12Buffer, p12Password } = await obtenerCertificado(supabase, comprobante.empresa_id);
    const xmlFirmado = await firmarXML(xmlSinFirma, p12Buffer, p12Password);
    
    // Actualizar estado: FIRMADO
    await actualizarComprobante(supabase, comprobanteId, {
      clave_acceso: claveAcceso,
      xml_sin_firma: xmlSinFirma,
      xml_firmado: xmlFirmado,
      estado: 'signed',
    });
    
    // 5. Enviar al SRI
    const respuestaRecepcion = await enviarComprobante(xmlFirmado, comprobante.ambiente);
    
    // Registrar en log
    await registrarLogSRI(supabase, {
      empresa_id: comprobante.empresa_id,
      comprobante_id: comprobanteId,
      operacion: 'recepcion',
      ws_url: comprobante.ambiente === '2' ? process.env.SRI_WS_RECEPCION_PROD : process.env.SRI_WS_RECEPCION_PRUEBAS,
      xml_enviado: xmlFirmado.substring(0, 500),
      estado_respuesta: respuestaRecepcion.estado,
      mensajes: respuestaRecepcion.mensajes,
      tiempo_respuesta_ms: respuestaRecepcion.tiempoMs,
    });
    
    if (respuestaRecepcion.estado === 'DEVUELTA') {
      await actualizarComprobante(supabase, comprobanteId, { estado: 'DEV' });
      return { estado: 'DEV', mensajes: respuestaRecepcion.mensajes };
    }
    
    // Actualizar estado: ENVIADO
    await actualizarComprobante(supabase, comprobanteId, { estado: 'sent' });
    
    // 6. Consultar autorización (con reintentos)
    let autorizacion = null;
    for (let i = 0; i < MAX_REINTENTOS_AUTORIZACION; i++) {
      await new Promise(r => setTimeout(r, DELAY_REINTENTO_MS));
      
      autorizacion = await consultarAutorizacion(claveAcceso, comprobante.ambiente);
      
      await registrarLogSRI(supabase, {
        empresa_id: comprobante.empresa_id,
        comprobante_id: comprobanteId,
        operacion: 'autorizacion',
        ws_url: comprobante.ambiente === '2' ? process.env.SRI_WS_AUTORIZACION_PROD : process.env.SRI_WS_AUTORIZACION_PRUEBAS,
        estado_respuesta: autorizacion.estado,
        mensajes: autorizacion.mensajes,
        tiempo_respuesta_ms: autorizacion.tiempoMs,
        intentos: i + 1,
      });
      
      if (autorizacion.estado === 'AUTORIZADO' || autorizacion.estado === 'NO AUTORIZADO') {
        break;
      }
    }
    
    // 7. Actualizar estado final
    if (autorizacion?.estado === 'AUTORIZADO') {
      await actualizarComprobante(supabase, comprobanteId, {
        estado: 'AUT',
        numero_autorizacion: autorizacion.numeroAutorizacion,
        fecha_autorizacion: autorizacion.fechaAutorizacion,
        xml_autorizado: autorizacion.xmlAutorizado,
      });
      return { estado: 'AUT', claveAcceso, autorizacion };
    } else if (autorizacion?.estado === 'NO AUTORIZADO') {
      await actualizarComprobante(supabase, comprobanteId, { estado: 'NAT' });
      return { estado: 'NAT', mensajes: autorizacion.mensajes };
    } else {
      // EN PROCESAMIENTO — el polling continuará en background
      await actualizarComprobante(supabase, comprobanteId, { estado: 'PPR' });
      return { estado: 'PPR', claveAcceso };
    }
  } catch (error) {
    console.error('Error procesando comprobante:', error);
    throw error;
  }
}

// Funciones auxiliares
async function obtenerComprobanteCompleto(supabase, id) {
  const { data } = await supabase
    .from('comprobantes')
    .select(`
      *,
      empresa:empresas(*),
      establecimiento:establecimientos(*),
      punto_emision:puntos_emision(*),
      cliente:clientes(*),
      detalles:comprobante_detalles(
        *,
        impuestos:comprobante_impuestos(*)
      ),
      pagos:comprobante_pagos(*)
    `)
    .eq('id', id)
    .single();
  return data;
}

async function actualizarComprobante(supabase, id, datos) {
  await supabase.from('comprobantes').update(datos).eq('id', id);
}

async function registrarLogSRI(supabase, log) {
  await supabase.from('sri_log').insert(log);
}

async function obtenerCertificado(supabase, empresaId) {
  // Obtener el .p12 de Supabase Storage y descifrarlo
  const { data: empresa } = await supabase
    .from('empresas')
    .select('certificado_path, certificado_password_encrypted')
    .eq('id', empresaId)
    .single();
  
  const { data: fileData } = await supabase.storage
    .from('certificados')
    .download(empresa.certificado_path);
  
  const p12Buffer = Buffer.from(await fileData.arrayBuffer());
  
  // Descifrar password AES-256
  const { descifrarAES } = await import('@/lib/crypto/p12-manager');
  const p12Password = descifrarAES(empresa.certificado_password_encrypted);
  
  return { p12Buffer, p12Password };
}

function prepararDatosXML(comp, claveAcceso) {
  return {
    ambiente: comp.ambiente,
    tipoEmision: comp.tipo_emision,
    tipoComprobante: comp.tipo_comprobante,
    claveAcceso,
    secuencial: comp.secuencial,
    fechaEmision: comp.fecha_emision,
    moneda: comp.moneda,
    emisor: {
      ruc: comp.empresa.ruc,
      razonSocial: comp.empresa.razon_social,
      nombreComercial: comp.empresa.nombre_comercial,
      direccion: comp.empresa.direccion_matriz,
      obligadoContabilidad: comp.empresa.obligado_contabilidad,
      contribuyenteEspecial: comp.empresa.contribuyente_especial,
      contribuyenteRimpe: comp.empresa.contribuyente_rimpe,
      agenteRetencion: comp.empresa.agente_retencion,
    },
    establecimiento: {
      codigo: comp.establecimiento.codigo,
      direccion: comp.establecimiento.direccion,
    },
    puntoEmision: {
      codigo: comp.punto_emision.codigo,
    },
    comprador: {
      tipoIdentificacion: comp.tipo_identificacion_comprador,
      identificacion: comp.identificacion_comprador,
      razonSocial: comp.razon_social_comprador,
      direccion: comp.direccion_comprador,
    },
    detalles: comp.detalles.map(d => ({
      codigoPrincipal: d.codigo_principal,
      codigoAuxiliar: d.codigo_auxiliar,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precio_unitario,
      descuento: d.descuento,
      precioTotalSinImpuesto: d.precio_total_sin_impuesto,
      detallesAdicionales: d.detalles_adicionales || [],
      impuestos: d.impuestos.map(i => ({
        codigo: i.codigo,
        codigoPorcentaje: i.codigo_porcentaje,
        tarifa: i.tarifa,
        baseImponible: i.base_imponible,
        valor: i.valor,
      })),
    })),
    totales: {
      totalSinImpuestos: comp.subtotal_sin_impuestos,
      totalDescuento: comp.total_descuento,
      propina: comp.propina,
      importeTotal: comp.importe_total,
      impuestos: calcularTotalesImpuestos(comp.detalles),
    },
    pagos: comp.pagos.map(p => ({
      formaPago: p.forma_pago,
      total: p.total,
      plazo: p.plazo,
      unidadTiempo: p.unidad_tiempo,
    })),
    infoAdicional: comp.info_adicional || [],
  };
}

function calcularTotalesImpuestos(detalles) {
  const agrupados = {};
  for (const detalle of detalles) {
    for (const imp of detalle.impuestos) {
      const key = `${imp.codigo}-${imp.codigo_porcentaje}`;
      if (!agrupados[key]) {
        agrupados[key] = {
          codigo: imp.codigo,
          codigoPorcentaje: imp.codigo_porcentaje,
          baseImponible: 0,
          valor: 0,
        };
      }
      agrupados[key].baseImponible += imp.base_imponible;
      agrupados[key].valor += imp.valor;
    }
  }
  return Object.values(agrupados);
}
```

## 4.6 Módulo: Wizard Factura con IA (Gemini 3 Flash)

**SubAgente:** N/A (frontend) + Skill `glass-ui` + `nextjs-patterns`

### API Route: `src/app/api/ia/factura-wizard/route.js`

```javascript
/**
 * API Route para el wizard de factura con asistencia IA
 * Usa Vercel AI SDK con Gemini 3 Flash para streaming
 * 
 * Skill: nextjs-patterns
 */
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req) {
  const { messages, context } = await req.json();
  const supabase = await createClient();
  
  // Obtener datos de la empresa para contexto
  const { data: empresa } = await supabase
    .from('empresas')
    .select('ruc, razon_social, obligado_contabilidad, contribuyente_rimpe')
    .eq('id', context?.empresaId)
    .single();

  const result = streamText({
    model: google('gemini-3-flash-preview', {
      thinkingLevel: 'low',
    }),
    system: `Eres el asistente de facturación de facturIA. Tu rol es ayudar al usuario 
a crear facturas electrónicas válidas para el SRI de Ecuador.

CONTEXTO DE LA EMPRESA:
- RUC: ${empresa?.ruc || 'No configurado'}
- Razón Social: ${empresa?.razon_social || 'No configurada'}
- Obligado a contabilidad: ${empresa?.obligado_contabilidad ? 'SÍ' : 'NO'}
- RIMPE: ${empresa?.contribuyente_rimpe || 'No aplica'}

REGLAS TRIBUTARIAS ECUADOR:
- Tarifas IVA vigentes: 0% (código 0), 5% (código 5), 12% (código 2), 13% (código 10), 14% (código 3), 15% (código 4)
- No Objeto IVA: código 6, Exento: código 7
- Consumidor Final: identificación "9999999999999", tipo "07"
- RUC: 13 dígitos, validar con Módulo 11
- Cédula: 10 dígitos, validar con Módulo 10
- Formas de pago: 01=Sin sistema financiero, 16=Tarjeta débito, 17=Dinero electrónico, 18=Prepago, 19=Tarjeta crédito, 20=Otros con SF

TU COMPORTAMIENTO:
- Responde en español, de forma concisa y profesional
- Si detectas un error en los datos, explícalo claramente
- Sugiere productos basándote en el historial del cliente
- Calcula totales automáticamente cuando te lo pidan
- NUNCA inventes datos fiscales, siempre pide confirmación`,
    messages,
    tools: {
      buscarCliente: tool({
        description: 'Busca un cliente por nombre o identificación',
        parameters: z.object({
          termino: z.string().describe('Nombre, RUC o cédula del cliente'),
        }),
        execute: async ({ termino }) => {
          const { data } = await supabase
            .from('clientes')
            .select('id, razon_social, identificacion, tipo_identificacion, email')
            .or(`razon_social.ilike.%${termino}%,identificacion.ilike.%${termino}%`)
            .limit(5);
          return data || [];
        },
      }),
      buscarProducto: tool({
        description: 'Busca productos por nombre o código',
        parameters: z.object({
          termino: z.string().describe('Nombre o código del producto'),
        }),
        execute: async ({ termino }) => {
          const { data } = await supabase
            .from('productos')
            .select('id, codigo_principal, nombre, precio_unitario, tipo_iva')
            .or(`nombre.ilike.%${termino}%,codigo_principal.ilike.%${termino}%`)
            .eq('activo', true)
            .limit(10);
          return data || [];
        },
      }),
      calcularTotales: tool({
        description: 'Calcula los totales de la factura',
        parameters: z.object({
          items: z.array(z.object({
            cantidad: z.number(),
            precioUnitario: z.number(),
            descuento: z.number().default(0),
            tarifaIva: z.number(),
          })),
        }),
        execute: async ({ items }) => {
          let subtotal = 0;
          let totalIva = 0;
          let totalDescuento = 0;
          
          for (const item of items) {
            const base = item.cantidad * item.precioUnitario - item.descuento;
            subtotal += base;
            totalIva += base * (item.tarifaIva / 100);
            totalDescuento += item.descuento;
          }
          
          return {
            subtotalSinImpuestos: subtotal.toFixed(2),
            totalDescuento: totalDescuento.toFixed(2),
            totalIva: totalIva.toFixed(2),
            importeTotal: (subtotal + totalIva).toFixed(2),
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

### Componente: `src/components/wizard/IAAssistant.jsx`

```jsx
/**
 * Panel lateral de asistencia IA para el wizard de factura
 * Usa Vercel AI SDK useChat para streaming
 * 
 * Skill: glass-ui
 */
'use client';

import { useChat } from '@ai-sdk/react';
import { useEmpresaStore } from '@/stores/useEmpresaStore';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import { Bot, Send, Sparkles } from 'lucide-react';

export default function IAAssistant({ onSuggestion }) {
  const { empresa } = useEmpresaStore();
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ia/factura-wizard',
    body: {
      context: { empresaId: empresa?.id },
    },
    onToolCall: ({ toolCall }) => {
      // Propagar sugerencias al wizard
      if (toolCall.toolName === 'buscarCliente' || toolCall.toolName === 'buscarProducto') {
        onSuggestion?.(toolCall);
      }
    },
  });

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Sparkles className="w-5 h-5 text-white/70" />
        <span className="font-medium text-sm">Asistente IA</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-sm py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Pregúntame sobre clientes,</p>
            <p>productos o cálculos</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`text-sm ${
            m.role === 'user' ? 'text-right' : 'text-left'
          }`}>
            <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 ${
              m.role === 'user'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/80'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-1 px-3 py-2">
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce delay-100" />
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce delay-200" />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-2">
        <GlassInput
          value={input}
          onChange={handleInputChange}
          placeholder="Busca un cliente, producto..."
          className="flex-1 text-sm"
        />
        <GlassButton type="submit" disabled={isLoading} className="px-3">
          <Send className="w-4 h-4" />
        </GlassButton>
      </form>
    </GlassCard>
  );
}
```

## 4.7 Módulo: Análisis de Errores SRI con IA

**SubAgente:** `sri-validator` + IA Gemini 3 Flash

### Archivo: `src/lib/ia/error-analyzer.js`

```javascript
/**
 * Analiza errores del SRI usando Gemini 3 Flash
 * Traduce códigos técnicos a explicaciones en lenguaje natural
 * y sugiere acciones correctivas
 */
import { generateWithFallback } from './gemini-client';

export async function analizarErrorSRI(mensajes, contextoComprobante) {
  const prompt = `Eres un experto en facturación electrónica del SRI de Ecuador.
Analiza los siguientes errores/advertencias devueltos por el Web Service del SRI
y proporciona:
1. Explicación clara de cada error en lenguaje sencillo
2. Causa probable
3. Acción correctiva específica

ERRORES DEL SRI:
${JSON.stringify(mensajes, null, 2)}

CONTEXTO DEL COMPROBANTE:
- Tipo: ${contextoComprobante.tipo}
- RUC Emisor: ${contextoComprobante.ruc}
- Fecha: ${contextoComprobante.fecha}

Responde en JSON con el formato:
{
  "analisis": [
    {
      "codigo": "string",
      "explicacion": "string", 
      "causa": "string",
      "solucion": "string",
      "severidad": "critico|medio|bajo"
    }
  ],
  "resumen": "string"
}`;

  const response = await generateWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingLevel: 'medium' },
    },
  });

  return JSON.parse(response.text);
}
```

---

# 5. INTEGRACIÓN DE SUBAGENTES POR TAREA

## 5.1 Mapa de Subagentes y Skills por Módulo

| Módulo | SubAgente Principal | Skills | Tarea |
|---|---|---|---|
| Clave de Acceso | `sri-validator` | `xml-sri` | Validar estructura 49 dígitos, Módulo 11 |
| XML Builder | `sri-validator` | `xml-sri` | Validar XML contra XSD del SRI |
| Firma XAdES | `sri-validator` | `xml-sri` | Verificar firma, estructura ds:Signature |
| Cliente SOAP | `sri-validator` | `xml-sri` | Validar URLs WS, respuestas SOAP |
| Migraciones BD | `db-migrator` | `supabase-rls` | Crear tablas, políticas RLS, índices |
| Server Actions | `repo-scout` | `nextjs-patterns` | Verificar patrones, 'use server', Zod |
| Wizard UI | N/A (manual) | `glass-ui` | Componentes Glass, responsive |
| Tests | `test-writer` | Todos | Unit, Integration, E2E |
| CI/CD | N/A | `ci-cd-cloudrun` | Actualizar workflows para nuevas deps |

## 5.2 Flujo de Trabajo con Subagentes (por cada feature)

```
1. [repo-scout] analiza el codebase → identifica archivos existentes, dependencias
2. [db-migrator] crea migración SQL → tablas + RLS + índices (Skill: supabase-rls)
3. Desarrollador implementa lógica backend (Skill: nextjs-patterns)
4. [sri-validator] valida XML/firma/catálogos (Skill: xml-sri)
5. Desarrollador implementa UI (Skill: glass-ui)
6. [test-writer] genera tests → unit + integration + e2e
7. CI/CD ejecuta → lint + build + test + deploy staging
```

---

# 6. CRONOGRAMA DETALLADO — 20 DÍAS HÁBILES

| Día | Tarea | Módulo | SubAgente/Skill |
|-----|-------|--------|-----------------|
| 1 | Migración SDK IA: `@google/genai` + `@ai-sdk/google` → Gemini 3 Flash | IA | `repo-scout` |
| 2 | Migración BD: `004_comprobantes.sql` + `005_secuenciales.sql` + `006_sri_log.sql` | BD | `db-migrator` + `supabase-rls` |
| 3 | Generador clave de acceso 49 dígitos + Módulo 11 + tests | Core SRI | `sri-validator` + `xml-sri` |
| 4 | Gestor de secuenciales atómico (función SQL + Server Action) | Core SRI | `db-migrator` |
| 5-6 | XML Builder factura v1.1.0 (infoTributaria, infoFactura, detalles, impuestos, pagos) | Core SRI | `sri-validator` + `xml-sri` |
| 7-8 | Firma XAdES-BES con .p12 (node-forge + xml-crypto) + tests | Core SRI | `sri-validator` + `xml-sri` |
| 9 | Cliente SOAP: WS Recepción + WS Autorización + tests integración | Core SRI | `sri-validator` + `xml-sri` |
| 10 | Orquestador flujo completo (BORRADOR → AUT) + retry + logging | Core SRI | `sri-validator` |
| 11-12 | Wizard factura: StepCliente + StepDetalles + StepPagos | Frontend | `glass-ui` + `nextjs-patterns` |
| 13 | Wizard factura: StepResumen + StepConfirmacion + integración con orquestador | Frontend | `glass-ui` |
| 14 | Asistente IA en wizard (Gemini 3 Flash + useChat + tools) | IA + Frontend | `glass-ui` |
| 15 | Análisis errores SRI con IA + sugerencias correctivas | IA | `sri-validator` |
| 16 | RIDE PDF: template React-PDF conforme formato SRI | PDF | `glass-ui` |
| 17 | Email: envío automático XML autorizado + RIDE (Resend) | Email | `nextjs-patterns` |
| 18 | Listado comprobantes: tabla con filtros, estados, acciones, timeline | Frontend | `glass-ui` |
| 19 | Tests completos: unit (clave, XML, firma) + integration (SOAP) + e2e (wizard) | QA | `test-writer` |
| 20 | QA final + deploy staging + verificación con WS pruebas SRI | Deploy | `ci-cd-cloudrun` |

---

# 7. RIESGOS Y MITIGACIONES

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Gemini 3 Flash en preview puede tener inestabilidad | MEDIO | Fallback automático a `gemini-2.5-flash` (estable) |
| `@google/generative-ai` deprecado (shutdown 31 mar 2026) | **ALTO** | Migrar a `@google/genai` en Día 1 de esta fase |
| Firma XAdES-BES difícil de implementar correctamente | ALTO | Usar `node-forge` + `xml-crypto`, validar con SRI pruebas |
| WS SRI ambiente pruebas puede estar caído | MEDIO | Mock server local para desarrollo, tests con respuestas grabadas |
| Concurrencia en secuenciales | MEDIO | Función SQL atómica con `ON CONFLICT DO UPDATE` |
| Rate limits Gemini en wizard | BAJO | Throttle en cliente, cachear sugerencias frecuentes |
| Tamaño XML firmado supera límite SRI | BAJO | Comprimir, validar tamaño antes de enviar |

---

# 8. DEPENDENCIAS CRÍTICAS

```
Fase 3 depende de:
├── ✅ Fase 1 completada (auth, BD, CI/CD, componentes base)
├── ✅ Fase 2 completada (config empresa, .p12, clientes, productos, Gemini API)
├── 🔑 GEMINI_API_KEY configurada (ya existe)
├── 🔑 GOOGLE_GENERATIVE_AI_API_KEY=misma key (para Vercel AI SDK)
├── 🔑 ENCRYPTION_KEY 32 caracteres (ya existe)
├── 🔑 SRI_WS_RECEPCION_PRUEBAS URL configurada
├── 🔑 SRI_WS_AUTORIZACION_PRUEBAS URL configurada
├── 🔑 RESEND_API_KEY para envío email
├── 📦 npm: @google/genai, ai, @ai-sdk/google (NUEVAS)
├── 📦 npm: fast-xml-parser, node-forge, xml-crypto, soap (NUEVAS)
├── 📦 npm: @react-pdf/renderer, resend (NUEVAS)
└── 🔑 Certificado .p12 de prueba cargado en Supabase Storage
```

---

# 9. RESUMEN EJECUTIVO

La **Fase 3** implementa el **motor completo de facturación electrónica** para facturIA, cubriendo el ciclo de vida completo del comprobante desde su creación hasta la entrega al cliente con XML autorizado y RIDE PDF.

**Cambios clave respecto al plan original:**

1. **Migración de IA:** Se actualiza de `gemini-2.0-flash` (deprecated, shutdown 31/03/2026) a `gemini-3-flash-preview` (el modelo más reciente de la familia Gemini 3, lanzado enero 2026).

2. **Migración de SDK:** Se reemplaza `@google/generative-ai` (legacy) por dos SDKs modernos:
   - `@google/genai` v1.40.0 (SDK oficial unificado de Google GenAI) para llamadas server-side directas.
   - `ai` + `@ai-sdk/google` (Vercel AI SDK v6) para streaming, `useChat`, y la experiencia interactiva del wizard.

3. **Estrategia IA híbrida:** Se usa Vercel AI SDK para features interactivos (wizard, chat, sugerencias con streaming) y Google GenAI SDK para procesamiento batch (análisis de errores, validación XML).

4. **Subagentes activos:** Cada módulo del motor se desarrolla con el subagente y skill correspondiente (sri-validator + xml-sri para todo lo relacionado con SRI, db-migrator + supabase-rls para BD, test-writer para QA).

**Duración:** 20 días hábiles (4 semanas)  
**Modelo IA:** `gemini-3-flash-preview` (principal) + `gemini-2.5-flash` (fallback)  
**Entregables:** 10 módulos funcionales, todos con tests  
**Resultado:** Facturas electrónicas emitidas y autorizadas por el SRI ambiente de pruebas
