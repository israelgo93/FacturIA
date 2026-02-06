> **NOTA:** Este documento es el plan tecnico original de referencia. El sistema de diseno fue actualizado a **Ethereal Glass Monocromatico** (solo blanco y negro). Las referencias a colores (Indigo, Cyan, etc.) en este documento ya no aplican. Consultar `.cursor/rules/project.mdc` para las reglas vigentes.

# facturIA — Plataforma SaaS de Facturación Electrónica con IA
## Plan Técnico Integral v2.0

**Dominio:** facturia.app  
**Infraestructura:** Google Cloud Run + Supabase  
**Modelo:** SaaS Multi-Tenant con aislamiento por empresa  
**Diferenciador:** Inteligencia Artificial integrada para reportes, ATS y cumplimiento tributario

---

## 1. MODELO DE NEGOCIO SAAS

### 1.1 Concepto

facturIA es una plataforma SaaS que permite a empresas ecuatorianas emitir comprobantes electrónicos autorizados por el SRI, con asistencia de Inteligencia Artificial para generación automática de reportes tributarios (ATS, RDEP, declaraciones), análisis financiero y configuración intuitiva guiada.

### 1.2 Por qué "facturIA"

El nombre fusiona "factura" + "IA", comunicando que la inteligencia artificial es central en la plataforma, no un agregado. La IA asiste en cada paso: desde el onboarding hasta la generación de informes complejos para el SRI.

### 1.3 Planes de Suscripción

| Característica | Starter | Professional | Enterprise |
|---|---|---|---|
| Precio mensual | $9.99 | $24.99 | $49.99 |
| Comprobantes/mes | 50 | 300 | Ilimitados |
| Usuarios por empresa | 1 | 5 | Ilimitados |
| Establecimientos | 1 | 3 | Ilimitados |
| Puntos de emisión | 1 | 5 | Ilimitados |
| Generación ATS con IA | ✓ | ✓ | ✓ |
| Reportes IA avanzados | — | ✓ | ✓ |
| Dashboard analítico IA | Básico | Completo | Completo + Predicciones |
| Soporte | Email | Email + Chat | Prioritario + Llamada |
| API access | — | — | ✓ |
| RDEP automático | — | ✓ | ✓ |
| Multi-empresa | — | — | ✓ |

### 1.4 Aislamiento Multi-Tenant

Cada empresa opera en un espacio completamente aislado:

- **Row Level Security (RLS):** Todas las tablas filtran por `empresa_id`, imposibilitando acceso cruzado entre empresas.
- **Certificados digitales (.p12):** Almacenados en buckets separados por empresa con cifrado AES-256.
- **Secuenciales independientes:** Cada empresa mantiene sus propios secuenciales por tipo de comprobante, establecimiento y punto de emisión.
- **Reportes aislados:** El ATS, RDEP y demás informes se generan exclusivamente con datos de la empresa activa.

---

## 2. STACK TECNOLÓGICO

### 2.1 Core

| Componente | Tecnología | Versión |
|---|---|---|
| Framework Frontend/Backend | Next.js (App Router) | 15.5+ |
| Librería UI | React | 19 |
| Lenguaje | JavaScript (ES2024) | — |
| CSS Framework | Tailwind CSS | 4 |
| Base de datos | PostgreSQL (Supabase) | 15 |
| Autenticación | Supabase Auth | 2.45+ |
| Almacenamiento archivos | Supabase Storage | — |
| Edge Functions | Supabase (Deno runtime) | — |
| IA / LLM | Google Gemini API | 2.0 Flash |
| Despliegue | Google Cloud Run | — |
| Registro contenedores | Google Artifact Registry | — |
| CI/CD | GitHub Actions → Cloud Build | — |
| Dominio | facturia.app | — |

### 2.2 Dependencias Principales

```
# Core
next@15.5
react@19
react-dom@19
@supabase/supabase-js@2.45
@supabase/ssr@0.5
tailwindcss@4

# Formularios y Validación
react-hook-form@7
zod@3
@hookform/resolvers@3

# Estado Global
zustand@5

# UI y Animaciones
framer-motion@12
lucide-react
sonner              # toasts/notificaciones
recharts            # gráficos dashboard

# XML y Firma Electrónica
fast-xml-parser@4   # generación/parseo XML
node-forge@1.3      # firma XAdES-BES con .p12
xml-crypto@6        # firma digital XML
soap@1.1            # cliente SOAP para WS del SRI

# PDF
@react-pdf/renderer@4  # generación RIDE
pdf-lib@1.17            # manipulación PDF

# IA
@google/generative-ai@0.21  # Gemini API

# Email
resend@4

# Utilidades
date-fns@4
uuid
crypto-js@4         # cifrado AES-256

# PWA
next-pwa@5

# Testing
vitest@2
@playwright/test@1
msw@2               # mocking API
```

### 2.3 Infraestructura Google Cloud Run

```
┌─────────────────────────────────────────────────────────┐
│                    facturia.app                         │
│              (Google Cloud Run Service)                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Next.js 15.5 (Containerized)           │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │ App     │ │ Server   │ │ API Routes       │  │   │
│  │  │ Router  │ │ Actions  │ │ /api/sri/*       │  │   │
│  │  │ (SSR)   │ │          │ │ /api/reports/*   │  │   │
│  │  └─────────┘ └──────────┘ │ /api/ia/*        │  │   │
│  │                           └──────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────┬──────────────┬──────────────┬────────────┘
               │              │              │
    ┌──────────▼──────┐ ┌─────▼─────┐ ┌──────▼──────────┐
    │   Supabase      │ │ Google    │ │   SRI Ecuador   │
    │  (PostgreSQL +  │ │ Gemini    │ │   Web Services  │
    │   Auth +        │ │ API       │ │   (SOAP)        │
    │   Storage +     │ │           │ │                 │
    │   Edge Fns)     │ │           │ │                 │
    └─────────────────┘ └───────────┘ └─────────────────┘
```

### 2.4 Dockerfile para Cloud Run

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
```

### 2.5 CI/CD con GitHub Actions → Cloud Run

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: facturia-prod
  SERVICE: facturia-app
  REGION: us-east1
  
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Auth Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build & Push
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE }} \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 1 \
            --max-instances 10 \
            --memory 1Gi \
            --cpu 1 \
            --set-env-vars "NODE_ENV=production"
```

**Estrategia de ramas:**

| Rama | Propósito | Despliegue |
|---|---|---|
| `main` | Producción estable | Auto-deploy → Cloud Run (producción) |
| `develop` | Staging / QA | Auto-deploy → Cloud Run (staging) |
| `feature/*` | Nuevas funcionalidades | PR hacia develop |
| `hotfix/*` | Correcciones urgentes | PR directo a main |

---

## 3. INTELIGENCIA ARTIFICIAL — Motor IA de facturIA

### 3.1 Arquitectura del Motor IA

```
┌──────────────────────────────────────────────────────────┐
│                   Motor IA facturIA                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Asistente    │  │ Generador    │  │ Análisis      │  │
│  │ Configuración│  │ Reportes SRI │  │ Predictivo    │  │
│  │              │  │              │  │               │  │
│  │ • Onboarding │  │ • ATS XML    │  │ • Tendencias  │  │
│  │ • Productos  │  │ • RDEP XML   │  │ • Anomalías   │  │
│  │ • Impuestos  │  │ • Form 104   │  │ • Proyección  │  │
│  │ • Clientes   │  │ • Form 103   │  │   tributaria  │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼───────┐  │
│  │              Google Gemini API 2.0 Flash           │  │
│  │      (Structured Output + Function Calling)        │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │           Datos de la Empresa (Supabase)          │  │
│  │  Comprobantes · Clientes · Productos · Config     │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Funcionalidades IA

#### A) Asistente de Configuración Inteligente

El usuario puede conversar con la IA para configurar su empresa:

```
Usuario: "Soy una ferretería en Quito, régimen RIMPE emprendedor"
IA: "Perfecto. He configurado tu empresa así:
  • Actividad económica: Venta al por menor de artículos de ferretería
  • Régimen: RIMPE Emprendedor  
  • Obligado a llevar contabilidad: No
  • IVA más común en tus productos: 15%
  • Te sugiero crear categorías: Herramientas, Materiales, Pintura...
  ¿Quieres que configure los productos más comunes de ferretería?"
```

La IA deduce automáticamente configuraciones tributarias basándose en el tipo de negocio, régimen fiscal y normativa vigente.

#### B) Generación Automática de Reportes SRI

**ATS (Anexo Transaccional Simplificado):**

La IA recopila automáticamente de la base de datos todos los comprobantes del período fiscal seleccionado y genera el archivo XML compatible con el formato ATS del SRI:

```
Módulos del ATS generados automáticamente:
├── COMPRAS (comprobantes de retención emitidos)
├── VENTAS (facturas, notas de crédito/débito emitidas)
│   └── Los comprobantes electrónicos autorizados NO se
│       reportan en ventas del ATS (ya están en el SRI)
├── ANULADOS (comprobantes anulados en el período)
├── EXPORTACIONES (si aplica)
└── REEMBOLSOS (si aplica)
```

**Estructura XML del ATS generado:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<iva>
  <TipoIDInformante>R</TipoIDInformante>
  <IdInformante>1790012345001</IdInformante>
  <razonSocial>EMPRESA EJEMPLO S.A.</razonSocial>
  <Anio>2025</Anio>
  <Mes>12</Mes>
  <numEstabRuc>001</numEstabRuc>
  <totalVentas>15000.00</totalVentas>
  <codigoOperativo>IVA</codigoOperativo>
  
  <compras>
    <detalleCompras>
      <codSustento>01</codSustento>
      <tpIdProv>01</tpIdProv>
      <idProv>1790012345001</idProv>
      <tipoComprobante>01</tipoComprobante>
      <parteRel>NO</parteRel>
      <fechaRegistro>2025-12-15</fechaRegistro>
      <establecimiento>001</establecimiento>
      <puntoEmision>001</puntoEmision>
      <secuencial>000000150</secuencial>
      <fechaEmision>15/12/2025</fechaEmision>
      <autorizacion>...</autorizacion>
      <baseNoGraIva>0.00</baseNoGraIva>
      <baseImponible>500.00</baseImponible>
      <baseImpGrav>500.00</baseImpGrav>
      <baseImpExe>0.00</baseImpExe>
      <montoIva>75.00</montoIva>
      <montoIce>0.00</montoIce>
      <valorRetBienes>0.00</valorRetBienes>
      <valorRetServicios>0.00</valorRetServicios>
      <valRetBien10>0.00</valRetBien10>
      <valRetServ20>0.00</valRetServ20>
      <valRetServ50>0.00</valRetServ50>
      <valorRetBienes100>0.00</valorRetBienes100>
      <valorRetServicios100>0.00</valorRetServicios100>
      <totbasesImpRewordsemb>0.00</totbasesImpReemb>
      <pagoExterior>
        <pagoLocExt>01</pagoLocExt>
      </pagoExterior>
      <formasDePago>
        <formaPago>20</formaPago>
      </formasDePago>
      <air>
        <detalleAir>
          <codRetAir>303</codRetAir>
          <baseImpAir>500.00</baseImpAir>
          <porcentajeAir>10</porcentajeAir>
          <valRetAir>50.00</valRetAir>
        </detalleAir>
      </air>
    </detalleCompras>
  </compras>
  
  <ventas>
    <!-- Solo comprobantes NO electrónicos -->
    <!-- Los electrónicos autorizados ya están en el SRI -->
  </ventas>
  
  <anulados>
    <detalleAnulados>
      <tipoComprobante>01</tipoComprobante>
      <establecimiento>001</establecimiento>
      <puntoEmision>001</puntoEmision>
      <secuencialInicio>000000045</secuencialInicio>
      <secuencialFin>000000045</secuencialFin>
      <autorizacion>...</autorizacion>
    </detalleAnulados>
  </anulados>
</iva>
```

**RDEP (Relación de Dependencia):**

Para empresas con empleados, la IA genera automáticamente el XML del RDEP recopilando datos de nómina registrados en la plataforma.

**Formularios Sugeridos:**

La IA analiza los datos del período y sugiere pre-llenado de:

| Formulario | Descripción | Generación IA |
|---|---|---|
| ATS | Anexo Transaccional Simplificado | XML automático mensual/semestral |
| RDEP | Relación de Dependencia | XML anual automático |
| Form 104 | Declaración IVA | Pre-llenado sugerido |
| Form 103 | Retenciones en la Fuente | Pre-llenado sugerido |
| Form 101/102 | Impuesto a la Renta | Datos consolidados |

#### C) Análisis Inteligente y Predicciones

```
┌────────────────────────────────────────────────┐
│          Dashboard Analítico IA                │
│                                                │
│  📊 Tendencia de ventas: +12% vs mes anterior │
│  ⚠️  Anomalía: 3 facturas sin retención       │
│  💡 Sugerencia: Declarar IVA antes del 15     │
│  📈 Proyección: $45,000 ventas estimadas      │
│  🔔 El ATS de noviembre vence en 5 días       │
│                                                │
│  "Tienes 2 retenciones pendientes de emitir   │
│   por compras realizadas esta semana"          │
└────────────────────────────────────────────────┘
```

Funcionalidades analíticas:

- **Detección de anomalías:** Facturas sin retención, montos inusuales, clientes recurrentes sin RUC.
- **Recordatorios inteligentes:** Fechas de vencimiento de declaraciones según noveno dígito del RUC.
- **Proyección tributaria:** Estimación de impuestos a pagar basada en tendencia de ventas/compras.
- **Sugerencias de optimización:** Gastos deducibles no registrados, retenciones faltantes.
- **Resumen en lenguaje natural:** "Este mes vendiste $12,450, tu IVA a pagar es aproximadamente $1,867.50".

### 3.3 Implementación Técnica de la IA

```javascript
// src/lib/ia/gemini-client.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const iaModels = {
  // Modelo rápido para asistencia en tiempo real
  flash: genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,       // Baja temperatura para datos fiscales
      responseMimeType: 'application/json',
    }
  }),
  
  // Sistema prompt especializado en tributación ecuatoriana
  systemPrompt: `Eres el asistente IA de facturIA, especializado en 
    tributación ecuatoriana y facturación electrónica del SRI. 
    Conoces a profundidad: Ley de Régimen Tributario Interno, 
    Reglamento de Comprobantes de Venta, tarifas IVA vigentes 
    (0%, 5%, 12%, 13%, 14%, 15%), códigos de retención, 
    estructura del ATS, RDEP y formularios del SRI.
    Siempre responde con datos precisos y actualizados.
    Formato de valores: punto decimal, máximo 2 decimales.`
};

// Generador de ATS con IA
export async function generarATSConIA(empresaId, anio, mes) {
  // 1. Recopilar datos de la empresa
  const comprobantes = await obtenerComprobantesPeriodo(empresaId, anio, mes);
  const retenciones = await obtenerRetencionesPeriodo(empresaId, anio, mes);
  const anulados = await obtenerAnuladosPeriodo(empresaId, anio, mes);
  const empresa = await obtenerEmpresa(empresaId);
  
  // 2. IA valida y estructura los datos
  const resultado = await iaModels.flash.generateContent({
    systemInstruction: iaModels.systemPrompt,
    contents: [{
      role: 'user',
      parts: [{
        text: `Genera la estructura de datos para el ATS del período 
          ${mes}/${anio} para la empresa RUC ${empresa.ruc}.
          Datos de comprobantes: ${JSON.stringify(comprobantes)}
          Retenciones: ${JSON.stringify(retenciones)}
          Anulados: ${JSON.stringify(anulados)}
          
          Valida que:
          - Las bases imponibles cuadren con los totales
          - Los códigos de retención sean vigentes
          - Las formas de pago estén correctas
          - Identifica posibles errores antes de generar el XML
          
          Responde con el JSON estructurado del ATS.`
      }]
    }]
  });
  
  // 3. Generar XML compatible con esquema ATS del SRI
  return construirXMLATS(JSON.parse(resultado.response.text()));
}
```

---

## 4. BASE DE DATOS — Esquema Multi-Tenant

### 4.1 Diagrama Entidad-Relación

```
┌──────────────────┐     ┌──────────────────┐
│    auth.users     │     │  suscripciones   │
│  (Supabase Auth)  │────▶│  plan, estado    │
└────────┬─────────┘     │  fecha_inicio    │
         │               │  fecha_fin       │
         │               │  limite_docs     │
         ▼               └────────┬─────────┘
┌──────────────────┐              │
│    empresas      │◀─────────────┘
│  ruc, razon_soc  │
│  ambiente(1|2)   │
│  regimen_fiscal  │
│  plan_id         │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────┐
│estable-│ │certificados│
│cimien- │ │ .p12 path  │
│tos     │ │ password   │
│ codigo │ │ (AES-256)  │
│ direcc │ │ vigencia   │
└───┬────┘ └────────────┘
    │
    ▼
┌──────────────┐
│puntos_emision│
│ codigo       │──────────────────┐
│ estado       │                  │
└──────────────┘                  ▼
                          ┌──────────────┐
┌──────────┐              │ secuenciales │
│ clientes │              │ tipo_doc     │
│ identif  │              │ siguiente    │
│ tipo_id  │              └──────────────┘
│ razon_s  │
│ email    │◀─────┐
└──────────┘      │
                  │
┌──────────┐      │      ┌──────────────────┐
│productos │      │      │  comprobantes     │
│ codigo   │      ├──────│  clave_acceso(49) │
│ nombre   │      │      │  tipo_doc         │
│ precio   │      │      │  estado           │
│ iva_code │──────┼─────▶│  xml_path         │
└──────────┘      │      │  pdf_path         │
                  │      │  fecha_emision    │
                  │      │  total            │
                  │      └────────┬──────────┘
                  │               │
                  │      ┌────────▼──────────┐
                  │      │comprobante_detalle│
                  │      │  producto_id      │
                  │      │  cantidad         │
                  │      │  precio_unitario  │
                  │      │  descuento        │
                  │      │  impuestos        │
                  │      └──────────────────┘
                  │
                  │      ┌──────────────────┐
                  │      │  reportes_sri    │
                  └──────│  tipo (ATS/RDEP) │
                         │  periodo         │
                         │  xml_path        │
                         │  estado          │
                         │  generado_por_ia │
                         └──────────────────┘
```

### 4.2 SQL — Migración Inicial

```sql
-- =============================================
-- FACTURA IA - SCHEMA MULTI-TENANT
-- =============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLA: planes (Planes SaaS)
-- =============================================
CREATE TABLE planes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) NOT NULL,             -- 'starter', 'professional', 'enterprise'
  precio_mensual DECIMAL(10,2) NOT NULL,
  limite_comprobantes_mes INT,             -- NULL = ilimitado
  limite_usuarios INT,
  limite_establecimientos INT,
  limite_puntos_emision INT,
  tiene_reportes_ia BOOLEAN DEFAULT false,
  tiene_rdep BOOLEAN DEFAULT false,
  tiene_api BOOLEAN DEFAULT false,
  tiene_multi_empresa BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planes por defecto
INSERT INTO planes (nombre, precio_mensual, limite_comprobantes_mes, limite_usuarios, 
  limite_establecimientos, limite_puntos_emision, tiene_reportes_ia, tiene_rdep) VALUES
('starter', 9.99, 50, 1, 1, 1, false, false),
('professional', 24.99, 300, 5, 3, 5, true, true),
('enterprise', 49.99, NULL, NULL, NULL, NULL, true, true);

-- =============================================
-- TABLA: empresas
-- =============================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES planes(id),
  ruc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(300) NOT NULL,
  nombre_comercial VARCHAR(300),
  direccion_matriz VARCHAR(300) NOT NULL,
  obligado_contabilidad BOOLEAN DEFAULT false,
  contribuyente_especial VARCHAR(10),
  regimen_fiscal VARCHAR(50),           -- 'GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_NEGOCIO_POPULAR'
  agente_retencion VARCHAR(8),
  ambiente SMALLINT DEFAULT 1 CHECK (ambiente IN (1, 2)),  -- 1=Pruebas, 2=Producción
  tipo_emision SMALLINT DEFAULT 1,
  email_notificaciones VARCHAR(255),
  telefono VARCHAR(20),
  logo_url TEXT,
  activo BOOLEAN DEFAULT true,
  
  -- Suscripción
  suscripcion_estado VARCHAR(20) DEFAULT 'trial',   -- trial, active, suspended, cancelled
  suscripcion_inicio TIMESTAMPTZ DEFAULT NOW(),
  suscripcion_fin TIMESTAMPTZ,
  comprobantes_emitidos_mes INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_empresa_ruc UNIQUE(ruc)
);

-- =============================================
-- TABLA: establecimientos
-- =============================================
CREATE TABLE establecimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(3) NOT NULL,
  direccion VARCHAR(300) NOT NULL,
  nombre_comercial VARCHAR(300),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_estab_empresa UNIQUE(empresa_id, codigo)
);

-- =============================================
-- TABLA: puntos_emision
-- =============================================
CREATE TABLE puntos_emision (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(3) NOT NULL,
  descripcion VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_pto_emi UNIQUE(establecimiento_id, codigo)
);

-- =============================================
-- TABLA: secuenciales
-- =============================================
CREATE TABLE secuenciales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id) ON DELETE CASCADE,
  tipo_comprobante VARCHAR(2) NOT NULL,   -- 01, 04, 05, 06, 07, 08
  siguiente INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_secuencial UNIQUE(punto_emision_id, tipo_comprobante)
);

-- =============================================
-- TABLA: certificados (.p12)
-- =============================================
CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,                -- ruta en Supabase Storage
  password_encrypted TEXT NOT NULL,           -- cifrado AES-256
  emitido_por VARCHAR(300),
  fecha_emision TIMESTAMPTZ,
  fecha_expiracion TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: clientes
-- =============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_identificacion VARCHAR(2) NOT NULL,  -- 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final, 08=Exterior
  identificacion VARCHAR(20) NOT NULL,
  razon_social VARCHAR(300) NOT NULL,
  direccion VARCHAR(300),
  email VARCHAR(255),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_cliente_empresa UNIQUE(empresa_id, identificacion)
);

-- =============================================
-- TABLA: productos
-- =============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo_principal VARCHAR(25) NOT NULL,
  codigo_auxiliar VARCHAR(25),
  nombre VARCHAR(300) NOT NULL,
  descripcion TEXT,
  precio_unitario DECIMAL(18,6) NOT NULL DEFAULT 0,
  
  -- Impuestos
  iva_codigo VARCHAR(1) DEFAULT '2',        -- Tabla 16 SRI: 2=IVA
  iva_codigo_porcentaje VARCHAR(4) NOT NULL, -- 0=0%, 2=12%, 3=14%, 4=15%, 5=5%, 6=No objeto, 7=Exento, 8=Diferenciado, 10=13%
  ice_codigo VARCHAR(4),
  ice_tarifa DECIMAL(10,4),
  irbpnr_tarifa DECIMAL(10,2),
  
  -- Control
  tiene_stock BOOLEAN DEFAULT false,
  stock_actual DECIMAL(18,6) DEFAULT 0,
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_producto_empresa UNIQUE(empresa_id, codigo_principal)
);

-- =============================================
-- TABLA: comprobantes
-- =============================================
CREATE TABLE comprobantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id),
  cliente_id UUID REFERENCES clientes(id),
  
  -- Identificación SRI
  tipo_comprobante VARCHAR(2) NOT NULL,     -- 01, 04, 05, 06, 07, 08
  ambiente SMALLINT NOT NULL,
  tipo_emision SMALLINT DEFAULT 1,
  clave_acceso VARCHAR(49) UNIQUE,
  secuencial VARCHAR(9) NOT NULL,
  serie VARCHAR(6) NOT NULL,                -- estab + ptoEmi
  
  -- Estado del comprobante
  estado VARCHAR(20) DEFAULT 'CREADO',      -- CREADO, FIRMADO, ENVIADO, RECIBIDA, AUTORIZADO, NO_AUTORIZADO, ANULADO
  fecha_emision DATE NOT NULL,
  fecha_autorizacion TIMESTAMPTZ,
  numero_autorizacion VARCHAR(49),
  
  -- Montos
  subtotal_sin_impuestos DECIMAL(14,2) DEFAULT 0,
  subtotal_iva DECIMAL(14,2) DEFAULT 0,
  subtotal_iva_0 DECIMAL(14,2) DEFAULT 0,
  subtotal_no_objeto DECIMAL(14,2) DEFAULT 0,
  subtotal_exento DECIMAL(14,2) DEFAULT 0,
  total_descuento DECIMAL(14,2) DEFAULT 0,
  valor_iva DECIMAL(14,2) DEFAULT 0,
  valor_ice DECIMAL(14,2) DEFAULT 0,
  valor_irbpnr DECIMAL(14,2) DEFAULT 0,
  propina DECIMAL(14,2) DEFAULT 0,
  importe_total DECIMAL(14,2) DEFAULT 0,
  moneda VARCHAR(15) DEFAULT 'DOLAR',
  
  -- Formas de pago (JSON array)
  formas_pago JSONB DEFAULT '[]',
  
  -- Archivos
  xml_sin_firma_path TEXT,
  xml_firmado_path TEXT,
  xml_autorizado_path TEXT,
  ride_pdf_path TEXT,
  
  -- Email
  email_enviado BOOLEAN DEFAULT false,
  email_enviado_at TIMESTAMPTZ,
  
  -- Campos para notas de crédito/débito
  doc_sustento_tipo VARCHAR(2),
  doc_sustento_numero VARCHAR(15),
  doc_sustento_fecha DATE,
  motivo_modificacion VARCHAR(300),
  
  -- Metadata
  info_adicional JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: comprobante_detalles
-- =============================================
CREATE TABLE comprobante_detalles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  producto_id UUID REFERENCES productos(id),
  
  codigo_principal VARCHAR(25),
  descripcion VARCHAR(300) NOT NULL,
  cantidad DECIMAL(18,6) NOT NULL,
  precio_unitario DECIMAL(18,6) NOT NULL,
  descuento DECIMAL(14,2) DEFAULT 0,
  precio_total_sin_impuesto DECIMAL(14,2) NOT NULL,
  
  -- Impuestos del detalle (JSON)
  impuestos JSONB NOT NULL DEFAULT '[]',
  -- Ejemplo: [{"codigo":"2","codigoPorcentaje":"4","tarifa":"15","baseImponible":"100","valor":"15"}]
  
  detalles_adicionales JSONB DEFAULT '{}',
  orden INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: retencion_detalles (para tipo_comprobante = '07')
-- =============================================
CREATE TABLE retencion_detalles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Documento sustento (para retención ATS v2.0.0)
  cod_sustento VARCHAR(2),              -- Tabla 5 Catálogo ATS
  cod_doc_sustento VARCHAR(3),          -- Tabla 4 Catálogo ATS
  num_doc_sustento VARCHAR(15),
  fecha_emision_doc_sustento DATE,
  fecha_registro_contable DATE,
  num_aut_doc_sustento VARCHAR(49),
  pago_loc_ext VARCHAR(2) DEFAULT '01', -- 01=Local, 02=Exterior
  
  -- Retención
  codigo_impuesto VARCHAR(1) NOT NULL,  -- 1=Renta, 2=IVA, 6=ISD
  codigo_retencion VARCHAR(10) NOT NULL,
  base_imponible DECIMAL(14,2) NOT NULL,
  porcentaje_retener DECIMAL(5,2) NOT NULL,
  valor_retenido DECIMAL(14,2) NOT NULL,
  
  -- Forma de pago
  forma_pago VARCHAR(2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: reportes_sri (ATS, RDEP, etc.)
-- =============================================
CREATE TABLE reportes_sri (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  tipo_reporte VARCHAR(20) NOT NULL,    -- 'ATS', 'RDEP', 'FORM_104', 'FORM_103'
  anio INT NOT NULL,
  mes INT,                               -- NULL para reportes anuales
  periodicidad VARCHAR(10),              -- 'MENSUAL', 'SEMESTRAL', 'ANUAL'
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'BORRADOR', -- BORRADOR, GENERADO, VALIDADO, PRESENTADO
  
  -- Archivos
  xml_path TEXT,                         -- XML compatible SRI
  excel_path TEXT,                       -- Excel de respaldo
  pdf_resumen_path TEXT,                 -- Resumen PDF
  
  -- IA
  generado_por_ia BOOLEAN DEFAULT false,
  ia_observaciones TEXT,                 -- Observaciones/advertencias de la IA
  ia_anomalias_detectadas JSONB,         -- [{tipo, descripcion, comprobante_id}]
  
  -- Validación
  total_compras DECIMAL(14,2),
  total_ventas DECIMAL(14,2),
  total_retenciones DECIMAL(14,2),
  num_registros_compras INT,
  num_registros_ventas INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: sri_log (auditoría comunicación SRI)
-- =============================================
CREATE TABLE sri_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  comprobante_id UUID REFERENCES comprobantes(id),
  
  tipo_operacion VARCHAR(30) NOT NULL,   -- 'RECEPCION', 'AUTORIZACION', 'CONSULTA'
  url_servicio TEXT,
  request_xml TEXT,
  response_xml TEXT,
  estado_respuesta VARCHAR(20),          -- RECIBIDA, DEVUELTA, AUT, NAT, PPR
  mensajes_error JSONB,
  
  duracion_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: config_email
-- =============================================
CREATE TABLE config_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  proveedor VARCHAR(20) DEFAULT 'resend',  -- resend, smtp
  api_key_encrypted TEXT,
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_user VARCHAR(255),
  smtp_pass_encrypted TEXT,
  email_remitente VARCHAR(255),
  nombre_remitente VARCHAR(255),
  plantilla_asunto TEXT DEFAULT 'Comprobante Electrónico - {tipo} {serie}-{secuencial}',
  plantilla_cuerpo TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_config_email_empresa UNIQUE(empresa_id)
);

-- =============================================
-- TABLA: ia_conversaciones (historial chat IA)
-- =============================================
CREATE TABLE ia_conversaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contexto VARCHAR(50),                  -- 'onboarding', 'reportes', 'ayuda', 'configuracion'
  mensajes JSONB NOT NULL DEFAULT '[]',  -- [{role, content, timestamp}]
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_empresas_user ON empresas(user_id);
CREATE INDEX idx_empresas_ruc ON empresas(ruc);
CREATE INDEX idx_establecimientos_empresa ON establecimientos(empresa_id);
CREATE INDEX idx_puntos_emision_empresa ON puntos_emision(empresa_id);
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_identificacion ON clientes(empresa_id, identificacion);
CREATE INDEX idx_productos_empresa ON productos(empresa_id);
CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_estado ON comprobantes(empresa_id, estado);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(empresa_id, fecha_emision);
CREATE INDEX idx_comprobantes_clave ON comprobantes(clave_acceso);
CREATE INDEX idx_comprobantes_tipo ON comprobantes(empresa_id, tipo_comprobante);
CREATE INDEX idx_detalles_comprobante ON comprobante_detalles(comprobante_id);
CREATE INDEX idx_retenciones_comprobante ON retencion_detalles(comprobante_id);
CREATE INDEX idx_reportes_empresa ON reportes_sri(empresa_id, tipo_reporte, anio, mes);
CREATE INDEX idx_sri_log_empresa ON sri_log(empresa_id);
CREATE INDEX idx_sri_log_comprobante ON sri_log(comprobante_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_emision ENABLE ROW LEVEL SECURITY;
ALTER TABLE secuenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobante_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retencion_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_sri ENABLE ROW LEVEL SECURITY;
ALTER TABLE sri_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_conversaciones ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven datos de SUS empresas
CREATE POLICY "empresas_own" ON empresas
  FOR ALL USING (user_id = auth.uid());

-- Política genérica para tablas hijas (vía empresa_id)
-- Se aplica el mismo patrón a todas las tablas con empresa_id
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'establecimientos','puntos_emision','secuenciales','certificados',
    'clientes','productos','comprobantes','comprobante_detalles',
    'retencion_detalles','reportes_sri','sri_log','config_email',
    'ia_conversaciones'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "%s_tenant" ON %I FOR ALL USING (
        empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
      )', t, t
    );
  END LOOP;
END $$;

-- =============================================
-- FUNCIONES
-- =============================================

-- Función: obtener siguiente secuencial
CREATE OR REPLACE FUNCTION obtener_siguiente_secuencial(
  p_empresa_id UUID,
  p_punto_emision_id UUID,
  p_tipo_comprobante VARCHAR(2)
) RETURNS INT AS $$
DECLARE
  v_siguiente INT;
BEGIN
  INSERT INTO secuenciales (empresa_id, punto_emision_id, tipo_comprobante, siguiente)
  VALUES (p_empresa_id, p_punto_emision_id, p_tipo_comprobante, 2)
  ON CONFLICT (punto_emision_id, tipo_comprobante)
  DO UPDATE SET siguiente = secuenciales.siguiente + 1
  RETURNING siguiente - 1 INTO v_siguiente;
  
  RETURN v_siguiente;
END;
$$ LANGUAGE plpgsql;

-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON empresas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_comprobantes_updated BEFORE UPDATE ON comprobantes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reportes_updated BEFORE UPDATE ON reportes_sri 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. INTEGRACIÓN SRI — Motor de Comprobantes Electrónicos

### 5.1 Web Services del SRI (SOAP)

| Servicio | Ambiente Pruebas | Ambiente Producción |
|---|---|---|
| Recepción | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl` |
| Autorización | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl` |
| Consulta validez | WS consulta de comprobantes | WS consulta de comprobantes |
| Consulta FCN | WS factura comercial negociable | WS factura comercial negociable |

### 5.2 Flujo Completo de Emisión

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

### 5.3 Clave de Acceso (49 dígitos)

```
Posición:  [1-8]    [9-10]  [11-23]       [24]   [25-30] [31-39]         [40-47]    [48]      [49]
Contenido: Fecha    TipDoc  RUC           Amb    Serie   Secuencial      CódNum     TipoEm    Dígito
           ddmmaaaa  01      1790012345001  1     001001  000000001       12345678    1         Mod11
```

### 5.4 Tipos de Comprobantes

| Código | Tipo | Implementación |
|---|---|---|
| 01 | Factura | Fase 3 |
| 04 | Nota de Crédito | Fase 4 |
| 05 | Nota de Débito | Fase 4 |
| 06 | Guía de Remisión | Fase 4 |
| 07 | Comprobante de Retención | Fase 4 |
| 08 | Liquidación de Compra | Fase 4 |

### 5.5 Firma Electrónica XAdES-BES

| Especificación | Valor |
|---|---|
| Estándar | XAdES-BES |
| Versión esquema | 1.3.2 |
| URI | `http://uri.etsi.org/01903/v1.3.2#` |
| Algoritmo | RSA-SHA1 |
| Longitud clave | 2048 bits |
| Tipo firma | ENVELOPED |
| Archivo certificado | PKCS#12 (.p12) |
| Codificación | UTF-8 |

---

## 6. REPORTES SRI — Generación con IA

### 6.1 ATS — Anexo Transaccional Simplificado

**Periodicidad:**
- **Mensual:** Sociedades, personas naturales obligadas a llevar contabilidad, agentes de retención.
- **Semestral:** RIMPE Emprendedores (1er semestre: enero-junio, 2do: julio-diciembre).

**Fecha de presentación:** Según noveno dígito del RUC (la IA calcula y recuerda automáticamente).

**Módulos del ATS que genera facturIA:**

| Módulo | Fuente de datos | Generación |
|---|---|---|
| Compras | Retenciones emitidas + compras registradas | Automática desde BD |
| Ventas | Facturas/NC/ND NO electrónicas | Automática (electrónicas se excluyen) |
| Exportaciones | Facturas de exportación | Automática si aplica |
| Anulados | Comprobantes anulados | Automática desde BD |
| Reembolsos | Facturas de reembolso | Automática si aplica |

**Nota importante del SRI:** Los comprobantes electrónicos autorizados (facturas, NC, ND) NO se reportan en el módulo de ventas del ATS. Los comprobantes de retención electrónicos NO se reportan en compras del ATS a partir de enero 2018, siempre que cumplan con los formatos vigentes XSD/XML.

**Proceso IA para generar ATS:**

```
1. Usuario selecciona período (mes/año o semestre)
2. IA recopila todos los datos del período de la empresa
3. IA valida:
   ├── Códigos de sustento válidos (Tabla 5 Catálogo ATS)
   ├── Tipos de comprobante válidos (Tabla 4 Catálogo ATS)
   ├── Formas de pago correctas
   ├── Bases imponibles cuadran con totales
   ├── Retenciones con códigos vigentes
   └── Bancarización si supera $500 (desde dic 2023)
4. IA detecta anomalías y alerta al usuario
5. IA genera XML compatible con esquema at.xsd del SRI
6. Usuario descarga XML listo para subir al DIMM o SRI en línea
7. Opcionalmente genera Excel de respaldo
```

### 6.2 RDEP — Relación de Dependencia

Generado anualmente para empresas con empleados:

```
Datos recopilados automáticamente:
├── Ingresos gravados y exentos
├── Aportes IESS personal
├── Impuesto a la renta causado
├── Retenciones efectuadas
└── 13ro, 14to sueldo, fondos de reserva
```

### 6.3 Pre-llenado de Formularios

La IA genera datos consolidados que el usuario puede usar para pre-llenar:

| Formulario | Datos que genera facturIA |
|---|---|
| **104 (IVA)** | Ventas gravadas, ventas 0%, crédito tributario, IVA cobrado, IVA pagado |
| **103 (Retenciones)** | Retenciones de renta por código, retenciones IVA, ISD |
| **101 (Renta Sociedades)** | Ingresos, costos, gastos deducibles consolidados del año |
| **102 (Renta P. Naturales)** | Ingresos, gastos personales deducibles |

---

## 7. UI/UX — DISEÑO GLASSMORPHISM MOBILE-FIRST

### 7.1 Sistema de Diseño

```css
/* Tokens de diseño facturIA */
:root {
  /* Fondo gradiente oscuro */
  --bg-gradient: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  
  /* Glass effects */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  /* Colores de marca */
  --primary: #6366f1;        /* Indigo — marca facturIA */
  --primary-light: #818cf8;
  --accent: #06b6d4;         /* Cyan — IA / inteligencia */
  --accent-light: #22d3ee;
  
  /* Semáforo de estados SRI */
  --status-creado: #94a3b8;     /* Slate */
  --status-firmado: #f59e0b;    /* Amber */
  --status-enviado: #3b82f6;    /* Blue */
  --status-autorizado: #10b981; /* Emerald */
  --status-no-autorizado: #ef4444; /* Red */
  --status-anulado: #6b7280;    /* Gray */
  
  /* Tipografía */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 7.2 Pantallas Principales

```
┌─────────────────────────────────────────┐
│              facturIA                    │
├─────────────────────────────────────────┤
│                                         │
│  1. ONBOARDING INTELIGENTE (con IA)     │
│     ├── Registro usuario                │
│     ├── Chat IA: "¿Qué tipo de         │
│     │   negocio tienes?"                │
│     ├── Configuración auto empresa      │
│     ├── Subir certificado .p12          │
│     └── Tutorial interactivo            │
│                                         │
│  2. DASHBOARD                           │
│     ├── KPIs: ventas, IVA, retenciones │
│     ├── Gráfico de ventas (recharts)    │
│     ├── Alertas IA (vencimientos,       │
│     │   anomalías)                      │
│     ├── Actividad reciente              │
│     └── Asistente IA (chat flotante)    │
│                                         │
│  3. COMPROBANTES                        │
│     ├── Crear Factura (wizard IA)       │
│     ├── Nota de Crédito                 │
│     ├── Nota de Débito                  │
│     ├── Retención                       │
│     ├── Guía de Remisión                │
│     ├── Liquidación de Compra           │
│     └── Listado con filtros + estados   │
│                                         │
│  4. CATÁLOGOS                           │
│     ├── Clientes (CRUD + import CSV)    │
│     └── Productos (CRUD + import CSV)   │
│                                         │
│  5. REPORTES IA                         │
│     ├── Generar ATS (mensual/semestral) │
│     ├── Generar RDEP (anual)            │
│     ├── Pre-llenado Form 104 (IVA)      │
│     ├── Pre-llenado Form 103 (Ret.)     │
│     ├── Reporte de ventas               │
│     ├── Reporte de impuestos            │
│     └── Análisis IA (chat)              │
│                                         │
│  6. CONFIGURACIÓN                       │
│     ├── Empresa                         │
│     ├── Establecimientos / Ptos emisión │
│     ├── Certificado digital             │
│     ├── Email (SMTP/Resend)             │
│     ├── Plan / Suscripción              │
│     └── Usuarios (multi-usuario)        │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 Breakpoints (Mobile-First)

| Nombre | Ancho | Dispositivo | Layout |
|---|---|---|---|
| base | 0px+ | Teléfonos | 1 columna, bottom nav |
| sm | 640px+ | Teléfonos grandes | 1 columna mejorada |
| md | 768px+ | Tablets | 2 columnas |
| lg | 1024px+ | Laptops | Sidebar + contenido |
| xl | 1280px+ | Escritorios | Sidebar expandida + contenido amplio |

---

## 8. ESTRUCTURA DEL PROYECTO

```
facturia/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + Test + Build
│       ├── deploy-staging.yml        # Deploy develop → Cloud Run staging
│       └── deploy-production.yml     # Deploy main → Cloud Run production
│
├── Dockerfile
├── .dockerignore
├── next.config.mjs
├── tailwind.config.js
├── package.json
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Root layout + providers
│   │   ├── page.js                   # Landing page facturia.app
│   │   │
│   │   ├── (auth)/                   # Grupo rutas públicas
│   │   │   ├── login/page.js
│   │   │   ├── registro/page.js
│   │   │   └── recuperar/page.js
│   │   │
│   │   ├── (dashboard)/              # Grupo rutas protegidas
│   │   │   ├── layout.js             # Sidebar + Topbar + Auth guard
│   │   │   ├── page.js               # Dashboard principal
│   │   │   │
│   │   │   ├── comprobantes/
│   │   │   │   ├── page.js           # Listado comprobantes
│   │   │   │   ├── nueva-factura/page.js
│   │   │   │   ├── nota-credito/page.js
│   │   │   │   ├── nota-debito/page.js
│   │   │   │   ├── retencion/page.js
│   │   │   │   ├── guia-remision/page.js
│   │   │   │   ├── liquidacion/page.js
│   │   │   │   └── [id]/page.js      # Detalle comprobante
│   │   │   │
│   │   │   ├── clientes/
│   │   │   │   ├── page.js
│   │   │   │   └── [id]/page.js
│   │   │   │
│   │   │   ├── productos/
│   │   │   │   ├── page.js
│   │   │   │   └── [id]/page.js
│   │   │   │
│   │   │   ├── reportes/             # ★ REPORTES IA
│   │   │   │   ├── page.js           # Hub de reportes
│   │   │   │   ├── ats/page.js       # Generador ATS
│   │   │   │   ├── rdep/page.js      # Generador RDEP
│   │   │   │   ├── iva/page.js       # Pre-llenado Form 104
│   │   │   │   ├── retenciones/page.js # Pre-llenado Form 103
│   │   │   │   ├── ventas/page.js    # Reporte de ventas
│   │   │   │   └── analisis/page.js  # Análisis IA interactivo
│   │   │   │
│   │   │   ├── ia/                   # ★ ASISTENTE IA
│   │   │   │   └── page.js           # Chat IA full page
│   │   │   │
│   │   │   ├── configuracion/
│   │   │   │   ├── page.js           # Tabs de configuración
│   │   │   │   ├── empresa/page.js
│   │   │   │   ├── establecimientos/page.js
│   │   │   │   ├── certificado/page.js
│   │   │   │   ├── email/page.js
│   │   │   │   ├── plan/page.js
│   │   │   │   └── usuarios/page.js
│   │   │   │
│   │   │   └── onboarding/           # ★ ONBOARDING CON IA
│   │   │       └── page.js
│   │   │
│   │   └── api/                      # API Routes
│   │       ├── sri/
│   │       │   ├── firmar/route.js
│   │       │   ├── enviar/route.js
│   │       │   ├── autorizar/route.js
│   │       │   └── ride/route.js
│   │       ├── reportes/
│   │       │   ├── ats/route.js
│   │       │   ├── rdep/route.js
│   │       │   └── exportar/route.js
│   │       ├── ia/
│   │       │   ├── chat/route.js
│   │       │   ├── analisis/route.js
│   │       │   └── sugerencias/route.js
│   │       └── webhooks/
│   │           └── stripe/route.js    # Pagos suscripción
│   │
│   ├── components/
│   │   ├── ui/                        # Componentes Glass
│   │   │   ├── GlassCard.jsx
│   │   │   ├── GlassButton.jsx
│   │   │   ├── GlassInput.jsx
│   │   │   ├── GlassSelect.jsx
│   │   │   ├── GlassModal.jsx
│   │   │   ├── GlassTable.jsx
│   │   │   ├── GlassSidebar.jsx
│   │   │   ├── GlassTopbar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   │
│   │   ├── ia/                        # ★ Componentes IA
│   │   │   ├── IAChat.jsx             # Chat flotante
│   │   │   ├── IAOnboarding.jsx       # Wizard IA
│   │   │   ├── IAAlerts.jsx           # Alertas inteligentes
│   │   │   ├── IAReportGenerator.jsx  # Generador reportes
│   │   │   └── IASuggestions.jsx      # Sugerencias contextuales
│   │   │
│   │   ├── forms/
│   │   │   ├── FacturaForm.jsx
│   │   │   ├── ClienteForm.jsx
│   │   │   ├── ProductoForm.jsx
│   │   │   ├── RetencionForm.jsx
│   │   │   └── EmpresaForm.jsx
│   │   │
│   │   ├── comprobantes/
│   │   │   ├── ComprobanteList.jsx
│   │   │   ├── ComprobanteCard.jsx
│   │   │   ├── RIDEPreview.jsx
│   │   │   └── ComprobanteTimeline.jsx
│   │   │
│   │   ├── reportes/
│   │   │   ├── ATSGenerator.jsx
│   │   │   ├── RDEPGenerator.jsx
│   │   │   ├── ReporteVentas.jsx
│   │   │   └── AnalisisIA.jsx
│   │   │
│   │   └── dashboard/
│   │       ├── StatsCards.jsx
│   │       ├── VentasChart.jsx
│   │       └── ActividadReciente.jsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.js              # Browser client
│   │   │   ├── server.js              # Server client
│   │   │   └── middleware.js           # Auth middleware
│   │   │
│   │   ├── sri/                       # ★ Motor SRI
│   │   │   ├── clave-acceso.js        # Generador clave 49 dígitos + Módulo 11
│   │   │   ├── xml-builder.js         # Construcción XML por tipo
│   │   │   ├── xml-signer.js          # Firma XAdES-BES
│   │   │   ├── soap-client.js         # Cliente SOAP WS SRI
│   │   │   ├── ride-generator.js      # Generador RIDE PDF
│   │   │   ├── catalogs.js            # Catálogos SRI (tablas)
│   │   │   └── validators.js          # Validaciones RUC, cédula, etc.
│   │   │
│   │   ├── ia/                        # ★ Motor IA
│   │   │   ├── gemini-client.js       # Cliente Gemini API
│   │   │   ├── ats-generator.js       # Generador ATS con IA
│   │   │   ├── rdep-generator.js      # Generador RDEP con IA
│   │   │   ├── analysis-engine.js     # Motor de análisis
│   │   │   ├── onboarding-agent.js    # Agente de configuración
│   │   │   └── prompts.js             # System prompts especializados
│   │   │
│   │   ├── reportes/                  # Generadores de reportes
│   │   │   ├── ats-xml-builder.js     # Constructor XML ATS
│   │   │   ├── rdep-xml-builder.js    # Constructor XML RDEP
│   │   │   ├── form104-builder.js     # Pre-llenado IVA
│   │   │   ├── form103-builder.js     # Pre-llenado Retenciones
│   │   │   └── excel-exporter.js      # Exportación Excel
│   │   │
│   │   ├── validations/               # Esquemas Zod
│   │   │   ├── empresa.schema.js
│   │   │   ├── cliente.schema.js
│   │   │   ├── producto.schema.js
│   │   │   ├── factura.schema.js
│   │   │   └── retencion.schema.js
│   │   │
│   │   └── utils/
│   │       ├── format.js              # Formateo moneda, fechas
│   │       ├── ruc-validator.js       # Validación RUC/cédula
│   │       ├── constants.js           # Constantes globales
│   │       └── encryption.js          # AES-256 para passwords
│   │
│   ├── actions/                       # Server Actions
│   │   ├── auth.actions.js
│   │   ├── empresa.actions.js
│   │   ├── cliente.actions.js
│   │   ├── producto.actions.js
│   │   ├── comprobante.actions.js
│   │   ├── reporte.actions.js
│   │   └── ia.actions.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useEmpresa.js
│   │   ├── useComprobantes.js
│   │   ├── useIA.js
│   │   └── useRealtime.js
│   │
│   └── stores/                        # Zustand stores
│       ├── factura-store.js
│       ├── ui-store.js
│       └── ia-store.js
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service Worker
│   ├── icons/
│   └── images/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 9. VARIABLES DE ENTORNO

```bash
# =============================================
# SUPABASE
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# =============================================
# SRI - WEB SERVICES
# =============================================
SRI_AMBIENTE=1                         # 1=Pruebas, 2=Producción

# Pruebas
SRI_WS_RECEPCION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WS_AUTORIZACION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl

# Producción
SRI_WS_RECEPCION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WS_AUTORIZACION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl

# =============================================
# SEGURIDAD
# =============================================
ENCRYPTION_KEY=clave-32-caracteres-para-aes256  # Cifrado passwords .p12

# =============================================
# INTELIGENCIA ARTIFICIAL
# =============================================
GEMINI_API_KEY=AIza...

# =============================================
# EMAIL
# =============================================
RESEND_API_KEY=re_...

# =============================================
# GOOGLE CLOUD
# =============================================
GCP_PROJECT_ID=facturia-prod
GCP_REGION=us-east1

# =============================================
# APP
# =============================================
NEXT_PUBLIC_APP_URL=https://facturia.app
NEXT_PUBLIC_APP_NAME=facturIA
NODE_ENV=production
PORT=8080
```

---

## 10. ROADMAP DE DESARROLLO — 18 Semanas, 7 Fases

### Fase 1: Fundación (Semanas 1-3)

| Tarea | Descripción |
|---|---|
| Setup proyecto | Next.js 15.5 + Tailwind 4 + PWA + Dockerfile |
| Componentes Glass | GlassCard, GlassButton, GlassInput, GlassSelect, GlassModal, GlassTable, GlassSidebar, GlassTopbar |
| Layout responsivo | Mobile-first con sidebar colapsable |
| Supabase Auth | Registro, login, recuperar contraseña, middleware |
| Schema BD | Migración inicial completa con RLS |
| Auth guard | Protección de rutas dashboard |

### Fase 2: Onboarding IA + Catálogos (Semanas 4-5)

| Tarea | Descripción |
|---|---|
| Onboarding IA | Chat guiado para configurar empresa (Gemini) |
| Config empresa | CRUD empresa + establecimiento + punto emisión |
| Upload .p12 | Subida y validación certificado digital |
| CRUD Clientes | Alta, edición, búsqueda, importación CSV, validación cédula/RUC |
| CRUD Productos | Alta con configuración IVA/ICE, categorías, importación CSV |

### Fase 3: Motor de Facturación (Semanas 6-9)

| Tarea | Descripción |
|---|---|
| Clave acceso | Generador 49 dígitos + Módulo 11 |
| XML Builder | Construcción XML factura v1.1.0 / v2.1.0 |
| Firma XAdES | Motor de firma electrónica con .p12 |
| Cliente SOAP | Comunicación con WS Recepción y Autorización SRI |
| Flujo completo | CREADO → FIRMADO → ENVIADO → AUTORIZADO |
| RIDE PDF | Generación representación impresa |
| Email | Envío automático XML + RIDE al cliente |
| Wizard factura | Formulario paso a paso con asistencia IA |

### Fase 4: Comprobantes Adicionales (Semanas 10-12)

| Tarea | Descripción |
|---|---|
| Nota de Crédito | Anulación parcial/total de facturas |
| Nota de Débito | Cargos adicionales |
| Retención | Retención ATS v2.0.0 (Renta, IVA, ISD) |
| Guía de Remisión | Transporte de mercadería |
| Liquidación de Compra | Compras a no obligados a facturar |

### Fase 5: Reportes IA + ATS (Semanas 13-15) ★

| Tarea | Descripción |
|---|---|
| Generador ATS | XML automático mensual/semestral compatible SRI |
| Generador RDEP | XML anual compatible SRI |
| Pre-llenado 104 | Datos consolidados para declaración IVA |
| Pre-llenado 103 | Datos consolidados para retenciones |
| Motor análisis IA | Detección anomalías, proyecciones, sugerencias |
| Chat IA reportes | Consultas en lenguaje natural sobre datos fiscales |
| Exportación | Excel y PDF de todos los reportes |

### Fase 6: Dashboard + UX (Semanas 16-17)

| Tarea | Descripción |
|---|---|
| Dashboard | KPIs, gráfico ventas, alertas IA, actividad |
| Notificaciones | Push notifications (vencimientos, autorizaciones) |
| Realtime | Actualización en tiempo real estado comprobantes |
| Plan/Suscripción | Integración pagos (Stripe), límites por plan |
| Multi-usuario | Invitar usuarios a la empresa |

### Fase 7: Producción y Calidad (Semana 18)

| Tarea | Descripción |
|---|---|
| Tests | Unit (Vitest) + E2E (Playwright) |
| CI/CD completo | GitHub Actions → Cloud Build → Cloud Run |
| Ambiente producción | Migración a WS producción SRI |
| Monitoreo | Sentry + Cloud Monitoring |
| Documentación | Técnica + manual usuario |
| Beta cerrada | Pruebas con empresas reales |

---

## 11. CATÁLOGOS SRI (Referencia Rápida)

### Tipos de Identificación (Tabla 6)

| Código | Descripción |
|---|---|
| 04 | RUC |
| 05 | Cédula |
| 06 | Pasaporte |
| 07 | Consumidor Final |
| 08 | Identificación del Exterior |

### Formas de Pago (Tabla 24 / Catálogo ATS)

| Código | Descripción |
|---|---|
| 01 | Sin utilización del sistema financiero |
| 15 | Compensación de deudas |
| 16 | Tarjeta de débito |
| 17 | Dinero electrónico |
| 18 | Tarjeta prepago |
| 19 | Tarjeta de crédito |
| 20 | Otros con utilización del sistema financiero |
| 21 | Endoso de títulos |

### Tarifas IVA (Tabla 17)

| Código | Tarifa |
|---|---|
| 0 | 0% |
| 2 | 12% |
| 3 | 14% |
| 4 | 15% |
| 5 | 5% |
| 6 | No objeto de IVA |
| 7 | Exento de IVA |
| 8 | IVA diferenciado |
| 10 | 13% |

### Retención IVA (Tabla 20)

| Porcentaje | Código |
|---|---|
| 10% | 9 |
| 20% | 10 |
| 30% | 1 |
| 50% | 11 |
| 70% | 2 |
| 100% | 3 |
| 0% (cero) | 7 |
| 0% (no procede) | 8 |

### Retención ISD

| Porcentaje | Código | Vigencia |
|---|---|---|
| 2.5% | 4586 | Desde mayo 2025 |

---

## 12. SEGURIDAD

| Capa | Implementación |
|---|---|
| Autenticación | Supabase Auth con MFA opcional |
| Autorización | RLS en todas las tablas por empresa_id |
| Certificados | .p12 en Supabase Storage cifrado, password AES-256 en BD |
| Comunicación SRI | HTTPS obligatorio, certificados SSL |
| Validación | Dual: Zod (frontend) + Server Actions (backend) + constraints BD |
| Cifrado | AES-256 para datos sensibles |
| Rate limiting | Middleware en API routes |
| Auditoría | sri_log para toda comunicación con WS SRI |
| Backups | Supabase point-in-time recovery |
| Secretos | Variables de entorno en Cloud Run (Secret Manager) |

---

## 13. RESUMEN EJECUTIVO

**facturIA** es una plataforma SaaS desplegada en **Google Cloud Run** que combina facturación electrónica certificada por el **SRI del Ecuador** con **Inteligencia Artificial** (Google Gemini) para automatizar la configuración empresarial, la generación de reportes tributarios (ATS, RDEP, formularios 103/104) y el análisis predictivo de la situación fiscal de cada empresa.

Cada empresa opera en un espacio **completamente aislado** gracias a Row Level Security de PostgreSQL. La IA no es un agregado, es el motor que simplifica la complejidad tributaria ecuatoriana para que cualquier emprendedor pueda facturar correctamente sin ser experto en impuestos.

**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Google Gemini · Cloud Run  
**Dominio:** facturia.app  
**Tiempo estimado:** 18 semanas  
**Diferenciador:** IA tributaria especializada en normativa ecuatoriana + UI glassmorphism mobile-first
