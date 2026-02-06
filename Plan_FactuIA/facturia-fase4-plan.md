# facturIA — Fase 4: Comprobantes Electrónicos Adicionales
## Plan de Implementación Detallado con Subagentes, Skills e IA Gemini 3 Flash

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 4 — Comprobantes Adicionales (Semanas 10-12, 15 días hábiles)  
**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Cloud Run  
**IA:** Google Gemini 3 Flash (`gemini-3-flash-preview`) via Vercel AI SDK + Google GenAI SDK  
**Fecha:** Febrero 2026

---

# ESTADO ACTUAL — Dependencias de Fases Anteriores

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

---

# PROBLEMA CONOCIDO — Firma Electrónica en Supabase Storage

## Diagnóstico

**Problema:** No se puede subir el certificado .p12 al bucket de Supabase Storage, lo que bloquea el flujo de firma y por tanto el envío de facturas y el email al cliente.

**Impacto:** El flujo completo FIRMAR → ENVIAR → AUTORIZAR → ENTREGAR no funciona en producción/staging porque el firmador (`xml-signer.js`) no puede leer el .p12 desde el bucket.

## Causas Posibles y Soluciones

### Causa 1: Bucket "certificados" no creado o sin políticas RLS correctas

```sql
-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE id = 'certificados';

-- Si no existe, crear:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificados',
  'certificados',
  false,  -- PRIVADO: nunca público
  5242880,  -- 5MB máximo
  ARRAY['application/x-pkcs12', 'application/octet-stream']
);
```

### Causa 2: Políticas de Storage mal configuradas

```sql
-- Eliminar políticas existentes si están mal
DROP POLICY IF EXISTS "Usuarios suben su certificado" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios leen su certificado" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios eliminan su certificado" ON storage.objects;

-- Política INSERT: usuario sube a su carpeta (empresa_id)
CREATE POLICY "Usuarios suben su certificado"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM empresas WHERE user_id = auth.uid()
  )
);

-- Política SELECT: usuario lee su certificado
CREATE POLICY "Usuarios leen su certificado"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM empresas WHERE user_id = auth.uid()
  )
);

-- Política DELETE: usuario elimina su certificado
CREATE POLICY "Usuarios eliminan su certificado"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM empresas WHERE user_id = auth.uid()
  )
);
```

### Causa 3: El upload usa la ruta incorrecta

```javascript
// ❌ Ruta incorrecta — sin empresa_id como carpeta
const { error } = await supabase.storage
  .from('certificados')
  .upload('firma.p12', file);

// ✅ Ruta correcta — con empresa_id como carpeta (match con RLS)
const { error } = await supabase.storage
  .from('certificados')
  .upload(`${empresaId}/firma.p12`, file, {
    contentType: 'application/x-pkcs12',
    upsert: true,
  });
```

### Causa 4: El mime type no está permitido en el bucket

Algunos navegadores envían el .p12 con mime type `application/octet-stream` en lugar de `application/x-pkcs12`. El bucket debe aceptar ambos (ver SQL del Causa 1).

### Causa 5: Service Role Key necesaria para lectura server-side

El firmador XAdES necesita leer el .p12 desde el servidor (Server Action o API Route). Esto requiere el cliente Supabase con `service_role_key`, no el `anon_key`:

```javascript
// En xml-signer.js o p12-manager.js — lectura server-side
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // NO anon_key
);

async function downloadP12(empresaId) {
  const { data, error } = await supabaseAdmin.storage
    .from('certificados')
    .download(`${empresaId}/firma.p12`);

  if (error) throw new Error(`Error descargando certificado: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}
```

## Acción Requerida — Día 0 de la Fase 4

Antes de iniciar los comprobantes adicionales, resolver el bloqueo de firma electrónica:

1. Verificar bucket `certificados` existe con mime types correctos
2. Aplicar políticas RLS de storage correctas
3. Verificar ruta de upload `{empresa_id}/firma.p12`
4. Verificar que `xml-signer.js` usa `supabaseAdmin` (service_role)
5. Test end-to-end: subir .p12 → firmar factura → enviar SRI → recibir email

---

# 1. VISIÓN GENERAL DE LA FASE 4

## 1.1 Objetivo

Implementar los **5 comprobantes electrónicos adicionales** del SRI, reutilizando la infraestructura del motor de facturación de la Fase 3 (clave de acceso, firma XAdES, cliente SOAP, orquestador, RIDE PDF, email). Cada comprobante tiene su propio XML Builder, su propio wizard/formulario, y su propio template RIDE.

## 1.2 Comprobantes a Implementar

| Código SRI | Tipo | Versión XML | Tag Raíz | Prioridad |
|---|---|---|---|---|
| `04` | Nota de Crédito | 1.1.0 | `<notaCredito>` | **ALTA** — más frecuente |
| `05` | Nota de Débito | 1.0.0 | `<notaDebito>` | MEDIA |
| `07` | Comprobante de Retención | 2.0.0 | `<comprobanteRetencion>` | **ALTA** — obligatorio para agentes |
| `06` | Guía de Remisión | 1.0.0 | `<guiaRemision>` | MEDIA |
| `03` | Liquidación de Compra | 1.1.0 | `<liquidacionCompra>` | BAJA — nicho específico |

> **⚠️ CORRECCIÓN IMPORTANTE:** El código SRI para Liquidación de Compra es `03`, NO `08` como indicaba el plan original. Esto se confirma en la Ficha Técnica del SRI v2.32, Anexo 17 y Tabla 3 del catálogo ATS. Se debe actualizar el CHECK constraint de la tabla `comprobantes` en la BD.

## 1.3 Qué se Reutiliza de la Fase 3

| Módulo | Archivo | Reutilización |
|---|---|---|
| Clave de acceso | `src/lib/sri/clave-acceso.js` | **100%** — ya soporta todos los `codDoc` |
| Firma XAdES-BES | `src/lib/sri/xml-signer.js` | **100%** — firma cualquier XML |
| Cliente SOAP | `src/lib/sri/soap-client.js` | **100%** — envía/autoriza cualquier tipo |
| Orquestador | `src/lib/sri/comprobante-orchestrator.js` | **95%** — agregar switch por tipo |
| Secuencial Manager | `src/lib/sri/secuencial-manager.js` | **100%** — ya filtra por tipo_comprobante |
| Catálogos SRI | `src/lib/sri/catalogs.js` | **90%** — agregar códigos retención |
| Email (Resend) | `src/lib/email/resend-client.js` | **100%** — mismo flujo |
| Gemini Client | `src/lib/ia/gemini-client.js` | **100%** — misma API |
| Error Analyzer | `src/lib/ia/error-analyzer.js` | **100%** — analiza cualquier error SRI |

## 1.4 Qué se Crea Nuevo en la Fase 4

| Módulo | Descripción |
|---|---|
| XML Builder NC/ND/Ret/GR/LC | 5 funciones nuevas en `xml-builder.js` |
| Wizards/Formularios UI | 5 páginas nuevas con formularios específicos |
| RIDE Templates | 5 templates PDF nuevos |
| Validadores específicos | Reglas de negocio por tipo de comprobante |
| Catálogos retención | Códigos IR, IVA, ISD para retenciones |
| Migraciones BD | Tablas auxiliares (retenciones detalle, destinatarios GR) |
| Server Actions | CRUD + procesamiento por tipo |
| Tests | Unit + Integration por cada tipo |

## 1.5 Entregables de la Fase 4

| # | Entregable | Criterio de Aceptación |
|---|---|---|
| 0 | Fix firma electrónica (bucket .p12) | Upload, firma y envío funcionando end-to-end |
| 1 | Nota de Crédito completa | XML v1.1.0 + wizard + RIDE + autorización SRI pruebas |
| 2 | Nota de Débito completa | XML v1.0.0 + wizard + RIDE + autorización SRI pruebas |
| 3 | Comprobante de Retención completo | XML v2.0.0 + wizard + RIDE + autorización SRI pruebas |
| 4 | Guía de Remisión completa | XML v1.0.0 + wizard + RIDE + autorización SRI pruebas |
| 5 | Liquidación de Compra completa | XML v1.1.0 + wizard + RIDE + autorización SRI pruebas |
| 6 | Listado unificado de comprobantes | Filtros por tipo, vista mixta todos los comprobantes |
| 7 | IA: Sugerencias por tipo de comprobante | Gemini sugiere datos según contexto del comprobante |
| 8 | Tests completos | Unit + Integration por cada tipo de comprobante |

---

# 2. CORRECCIÓN DE BASE DE DATOS — MIGRACIÓN 007

## 2.1 Migración `007_comprobantes_adicionales.sql`

**SubAgente:** `db-migrator` + Skill `supabase-rls`

```sql
-- ==============================================
-- MIGRACIÓN 007: Soporte Comprobantes Adicionales
-- Fase 4 — facturIA
-- ==============================================

-- 1. Corregir CHECK constraint: agregar '03' (Liquidación de Compra)
ALTER TABLE comprobantes
  DROP CONSTRAINT IF EXISTS comprobantes_tipo_comprobante_check;

ALTER TABLE comprobantes
  ADD CONSTRAINT comprobantes_tipo_comprobante_check
  CHECK (tipo_comprobante IN ('01','03','04','05','06','07'));
-- 01=Factura, 03=LiqCompra, 04=NC, 05=ND, 06=GR, 07=Retención

-- 2. Campos adicionales para NC/ND (referencia al documento modificado)
ALTER TABLE comprobantes
  ADD COLUMN IF NOT EXISTS doc_sustento_tipo TEXT,
  ADD COLUMN IF NOT EXISTS doc_sustento_numero TEXT,   -- 001-001-000000001
  ADD COLUMN IF NOT EXISTS doc_sustento_fecha DATE,
  ADD COLUMN IF NOT EXISTS motivo TEXT;                -- Motivo de NC/ND

-- 3. Campos adicionales para Retención
ALTER TABLE comprobantes
  ADD COLUMN IF NOT EXISTS ejercicio_fiscal TEXT,       -- mmaaaa (ej: 012026)
  ADD COLUMN IF NOT EXISTS tipo_sujeto_retenido TEXT;   -- 01=Persona Natural, 02=Sociedad

-- 4. Tabla: retenciones_detalle (impuestos retenidos)
CREATE TABLE IF NOT EXISTS retenciones_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Documento sustento de la retención
  cod_doc_sustento TEXT NOT NULL,    -- Código tipo doc (01=factura, etc.)
  num_doc_sustento TEXT NOT NULL,    -- 001-001-000000001
  fecha_emision_doc_sustento DATE NOT NULL,
  
  -- Impuesto retenido
  codigo_impuesto TEXT NOT NULL,     -- 1=Renta, 2=IVA, 6=ISD
  codigo_retencion TEXT NOT NULL,    -- Código porcentaje retención
  base_imponible DECIMAL(14,2) NOT NULL DEFAULT 0,
  porcentaje_retener DECIMAL(5,2) NOT NULL DEFAULT 0,
  valor_retenido DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Dividendos (cuando aplica)
  cod_doc_sustento_div TEXT,
  num_doc_sustento_div TEXT,
  fecha_emision_doc_sustento_div DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_retenciones_comprobante 
  ON retenciones_detalle(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_retenciones_empresa 
  ON retenciones_detalle(empresa_id);

-- RLS
ALTER TABLE retenciones_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_isolation_retenciones" ON retenciones_detalle
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- 5. Tabla: guia_remision_destinatarios
CREATE TABLE IF NOT EXISTS guia_remision_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Destinatario
  identificacion_destinatario TEXT NOT NULL,
  razon_social_destinatario TEXT NOT NULL,
  direccion_destinatario TEXT NOT NULL,
  motivo_traslado TEXT NOT NULL,
  ruta TEXT,
  
  -- Documento aduanero
  cod_doc_sustento TEXT,
  num_doc_sustento TEXT,
  num_autorizacion_doc_sustento TEXT,
  fecha_emision_doc_sustento DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: guia_remision_detalles (items transportados por destinatario)
CREATE TABLE IF NOT EXISTS guia_remision_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES guia_remision_destinatarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  codigo_interno TEXT,
  codigo_adicional TEXT,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(14,6) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gr_dest_comprobante 
  ON guia_remision_destinatarios(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_gr_det_destinatario 
  ON guia_remision_detalles(destinatario_id);

-- RLS para guía de remisión
ALTER TABLE guia_remision_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guia_remision_detalles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_isolation_gr_dest" ON guia_remision_destinatarios
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "empresa_isolation_gr_det" ON guia_remision_detalles
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- 6. Campos adicionales para Guía de Remisión
ALTER TABLE comprobantes
  ADD COLUMN IF NOT EXISTS dir_partida TEXT,
  ADD COLUMN IF NOT EXISTS fecha_inicio_transporte DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin_transporte DATE,
  ADD COLUMN IF NOT EXISTS razon_social_transportista TEXT,
  ADD COLUMN IF NOT EXISTS tipo_identificacion_transportista TEXT,
  ADD COLUMN IF NOT EXISTS ruc_transportista TEXT,
  ADD COLUMN IF NOT EXISTS placa TEXT;

-- 7. Campos adicionales para Liquidación de Compra
ALTER TABLE comprobantes
  ADD COLUMN IF NOT EXISTS razon_social_proveedor TEXT,
  ADD COLUMN IF NOT EXISTS identificacion_proveedor TEXT,
  ADD COLUMN IF NOT EXISTS tipo_identificacion_proveedor TEXT,
  ADD COLUMN IF NOT EXISTS direccion_proveedor TEXT;

-- 8. Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_comprobantes_tipo_estado
  ON comprobantes(empresa_id, tipo_comprobante, estado);

CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha_tipo
  ON comprobantes(empresa_id, fecha_emision DESC, tipo_comprobante);

-- 9. Vista materializada: resumen por tipo (para dashboard futuro)
CREATE OR REPLACE VIEW v_comprobantes_resumen AS
SELECT
  empresa_id,
  tipo_comprobante,
  estado,
  DATE_TRUNC('month', fecha_emision) AS mes,
  COUNT(*) AS cantidad,
  COALESCE(SUM(total), 0) AS total
FROM comprobantes
GROUP BY empresa_id, tipo_comprobante, estado, DATE_TRUNC('month', fecha_emision);
```

---

# 3. ARQUITECTURA DE ARCHIVOS — FASE 4

## 3.1 Estructura de Archivos Nuevos

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── comprobantes/
│   │   │   ├── page.js                          → Listado UNIFICADO (ya existe, extender)
│   │   │   ├── actions.js                       → Server Actions (extender con nuevos tipos)
│   │   │   ├── nuevo/page.js                    → Wizard factura (ya existe)
│   │   │   ├── nota-credito/
│   │   │   │   └── page.js                      → ★ Formulario Nota de Crédito
│   │   │   ├── nota-debito/
│   │   │   │   └── page.js                      → ★ Formulario Nota de Débito
│   │   │   ├── retencion/
│   │   │   │   └── page.js                      → ★ Formulario Retención
│   │   │   ├── guia-remision/
│   │   │   │   └── page.js                      → ★ Formulario Guía de Remisión
│   │   │   ├── liquidacion/
│   │   │   │   └── page.js                      → ★ Formulario Liquidación de Compra
│   │   │   └── [id]/
│   │   │       ├── page.js                      → Detalle (ya existe, extender)
│   │   │       └── ride/page.js                 → RIDE PDF (ya existe, extender)
│   │   └── ...
│   └── api/
│       ├── comprobantes/
│       │   ├── ride/[id]/route.js               → RIDE PDF (extender con templates)
│       │   └── email/[id]/route.js              → Email (reutilizar, sin cambios)
│       └── ia/
│           └── comprobante-wizard/route.js       → ★ IA contextual por tipo comprobante
│
├── lib/
│   ├── sri/
│   │   ├── xml-builder.js                       → ★ EXTENDER: 5 funciones nuevas
│   │   │   ├── buildNotaCreditoXML()
│   │   │   ├── buildNotaDebitoXML()
│   │   │   ├── buildRetencionXML()
│   │   │   ├── buildGuiaRemisionXML()
│   │   │   └── buildLiquidacionCompraXML()
│   │   ├── validators.js                        → ★ EXTENDER: validaciones por tipo
│   │   ├── catalogs.js                          → ★ EXTENDER: códigos retención
│   │   ├── comprobante-orchestrator.js          → ★ EXTENDER: switch por tipo
│   │   ├── ride-generator.js                    → ★ EXTENDER: templates por tipo
│   │   └── ...                                  → (sin cambios: clave-acceso, xml-signer, soap-client)
│   └── ia/
│       └── comprobante-prompts.js               → ★ Prompts IA por tipo de comprobante
│
├── components/
│   ├── comprobantes/
│   │   ├── ComprobanteList.jsx                  → ★ EXTENDER: filtros por tipo
│   │   ├── NotaCreditoForm.jsx                  → ★ Formulario NC
│   │   ├── NotaDebitoForm.jsx                   → ★ Formulario ND
│   │   ├── RetencionForm.jsx                    → ★ Formulario Retención
│   │   ├── GuiaRemisionForm.jsx                 → ★ Formulario GR
│   │   ├── LiquidacionCompraForm.jsx            → ★ Formulario LC
│   │   ├── SeleccionarFacturaBase.jsx           → ★ Selector de factura (para NC/ND/Ret)
│   │   └── StatusBadge.jsx                      → (sin cambios)
│   └── pdf/
│       ├── RIDETemplate.jsx                     → (ya existe: factura)
│       ├── RIDENotaCredito.jsx                  → ★ Template RIDE NC
│       ├── RIDENotaDebito.jsx                   → ★ Template RIDE ND
│       ├── RIDERetencion.jsx                    → ★ Template RIDE Retención
│       ├── RIDEGuiaRemision.jsx                 → ★ Template RIDE GR
│       └── RIDELiquidacionCompra.jsx            → ★ Template RIDE LC
│
└── hooks/
    └── useComprobanteForm.js                    → ★ Hook genérico para formularios

supabase/migrations/
└── 007_comprobantes_adicionales.sql             → ★ Tablas + RLS nuevas

tests/
├── unit/
│   └── sri/
│       ├── xml-builder-nc.test.js               → ★ XML Nota de Crédito
│       ├── xml-builder-nd.test.js               → ★ XML Nota de Débito
│       ├── xml-builder-ret.test.js              → ★ XML Retención
│       ├── xml-builder-gr.test.js               → ★ XML Guía de Remisión
│       └── xml-builder-lc.test.js               → ★ XML Liquidación de Compra
└── integration/
    └── comprobantes-adicionales.test.js          → ★ Flujo completo por tipo
```

---

# 4. XML BUILDERS POR TIPO DE COMPROBANTE

## 4.1 Nota de Crédito — `buildNotaCreditoXML()` (codDoc: 04, v1.1.0)

**SubAgente:** `sri-validator` + Skill `xml-sri`

**Campos específicos vs Factura:**
- Referencia al documento que modifica: `codDocModificado` + `numDocModificado` + `fechaEmisionDocSustento`
- Usa `<infoNotaCredito>` en lugar de `<infoFactura>`
- Sección `<motivo>` obligatoria
- La tarifa de IVA corresponde a la fecha de emisión del documento de sustento (NO de la NC)

```javascript
/**
 * XML Nota de Crédito v1.1.0
 * Ficha Técnica SRI — Formato XML Nota de Crédito (pág. 72)
 */
export function buildNotaCreditoXML(nc) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    notaCredito: {
      '@_id': 'comprobante',
      '@_version': '1.1.0',
      infoTributaria: buildInfoTributaria({ ...nc, tipoComprobante: '04' }),
      infoNotaCredito: {
        fechaEmision: formatDateSRI(nc.fechaEmision),
        ...(nc.establecimiento.direccion && { dirEstablecimiento: nc.establecimiento.direccion }),
        tipoIdentificacionComprador: nc.receptor.tipoIdentificacion,
        razonSocialComprador: nc.receptor.razonSocial,
        identificacionComprador: nc.receptor.identificacion,
        ...(nc.emisor.contribuyenteEspecial && { contribuyenteEspecial: nc.emisor.contribuyenteEspecial }),
        obligadoContabilidad: nc.emisor.obligadoContabilidad ? 'SI' : 'NO',
        // ★ Campos específicos NC
        codDocModificado: nc.docSustento.tipo,       // '01' para factura
        numDocModificado: nc.docSustento.numero,     // '001-001-000000001'
        fechaEmisionDocSustento: formatDateSRI(nc.docSustento.fecha),
        rise: nc.rise || undefined,
        totalSinImpuestos: nc.totalSinImpuestos.toFixed(2),
        valorModificacion: nc.valorModificacion.toFixed(2),
        moneda: 'DOLAR',
        totalConImpuestos: {
          totalImpuesto: nc.impuestos.map(imp => ({
            codigo: imp.codigo,
            codigoPorcentaje: imp.codigoPorcentaje,
            baseImponible: imp.baseImponible.toFixed(2),
            ...(imp.tarifa !== undefined && { tarifa: imp.tarifa.toFixed(2) }),
            valor: imp.valor.toFixed(2),
          })),
        },
        motivo: nc.motivo,
      },
      detalles: {
        detalle: nc.detalles.map(d => ({
          codigoInterno: d.codigoPrincipal,
          ...(d.codigoAdicional && { codigoAdicional: d.codigoAdicional }),
          descripcion: d.descripcion,
          cantidad: d.cantidad.toFixed(6),
          precioUnitario: d.precioUnitario.toFixed(6),
          descuento: (d.descuento || 0).toFixed(2),
          precioTotalSinImpuesto: d.precioTotalSinImpuesto.toFixed(2),
          impuestos: {
            impuesto: d.impuestos.map(imp => ({
              codigo: imp.codigo,
              codigoPorcentaje: imp.codigoPorcentaje,
              tarifa: imp.tarifa.toFixed(2),
              baseImponible: imp.baseImponible.toFixed(2),
              valor: imp.valor.toFixed(2),
            })),
          },
        })),
      },
    },
  };

  // Info adicional
  if (nc.infoAdicional?.length > 0) {
    xmlObj.notaCredito.infoAdicional = {
      campoAdicional: nc.infoAdicional.map(c => ({
        '@_nombre': c.nombre,
        '#text': c.valor,
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}
```

## 4.2 Nota de Débito — `buildNotaDebitoXML()` (codDoc: 05, v1.0.0)

**Campos específicos vs NC:**
- Estructura similar a NC pero con `<infoNotaDebito>`
- En lugar de `valorModificacion` se reportan los `motivos` como items con `razon` y `valor`
- No tiene sección `<detalles>` con productos, sino `<motivos>` con razones del cargo

```javascript
/**
 * XML Nota de Débito v1.0.0
 * Ficha Técnica SRI — Formato XML Nota de Débito (pág. 58)
 */
export function buildNotaDebitoXML(nd) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    notaDebito: {
      '@_version': '1.0.0',
      '@_id': 'comprobante',
      infoTributaria: buildInfoTributaria({ ...nd, tipoComprobante: '05' }),
      infoNotaDebito: {
        fechaEmision: formatDateSRI(nd.fechaEmision),
        ...(nd.establecimiento.direccion && { dirEstablecimiento: nd.establecimiento.direccion }),
        tipoIdentificacionComprador: nd.receptor.tipoIdentificacion,
        razonSocialComprador: nd.receptor.razonSocial,
        identificacionComprador: nd.receptor.identificacion,
        ...(nd.emisor.contribuyenteEspecial && { contribuyenteEspecial: nd.emisor.contribuyenteEspecial }),
        obligadoContabilidad: nd.emisor.obligadoContabilidad ? 'SI' : 'NO',
        // ★ Campos específicos ND
        codDocModificado: nd.docSustento.tipo,
        numDocModificado: nd.docSustento.numero,
        fechaEmisionDocSustento: formatDateSRI(nd.docSustento.fecha),
        totalSinImpuestos: nd.totalSinImpuestos.toFixed(2),
        impuestos: {
          impuesto: nd.impuestos.map(imp => ({
            codigo: imp.codigo,
            codigoPorcentaje: imp.codigoPorcentaje,
            tarifa: imp.tarifa.toFixed(2),
            baseImponible: imp.baseImponible.toFixed(2),
            valor: imp.valor.toFixed(2),
          })),
        },
        valorTotal: nd.valorTotal.toFixed(2),
        pagos: {
          pago: nd.pagos.map(p => ({
            formaPago: p.formaPago,
            total: p.total.toFixed(2),
            ...(p.plazo && { plazo: p.plazo }),
            ...(p.unidadTiempo && { unidadTiempo: p.unidadTiempo }),
          })),
        },
      },
      // ★ Motivos (en lugar de detalles con productos)
      motivos: {
        motivo: nd.motivos.map(m => ({
          razon: m.razon,
          valor: m.valor.toFixed(2),
        })),
      },
    },
  };

  if (nd.infoAdicional?.length > 0) {
    xmlObj.notaDebito.infoAdicional = {
      campoAdicional: nd.infoAdicional.map(c => ({
        '@_nombre': c.nombre,
        '#text': c.valor,
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}
```

## 4.3 Comprobante de Retención — `buildRetencionXML()` (codDoc: 07, v2.0.0)

**Estructura fundamentalmente diferente:**
- Usa `<infoCompRetencion>` con datos del sujeto retenido
- Sección `<docsSustento>` con múltiples documentos sustento
- Cada doc sustento tiene sus propias `<retenciones>` con códigos de impuesto
- Versión 2.0.0 incluye soporte para dividendos y doble tributación

```javascript
/**
 * XML Comprobante de Retención v2.0.0
 * Ficha Técnica SRI — Anexo 10 (pág. 43-53)
 * 
 * Códigos de impuesto:
 * - 1 = Renta
 * - 2 = IVA
 * - 6 = ISD (Impuesto a la Salida de Divisas)
 */
export function buildRetencionXML(ret) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    comprobanteRetencion: {
      '@_id': 'comprobante',
      '@_version': '2.0.0',
      infoTributaria: buildInfoTributaria({ ...ret, tipoComprobante: '07' }),
      infoCompRetencion: {
        fechaEmision: formatDateSRI(ret.fechaEmision),
        ...(ret.establecimiento.direccion && { dirEstablecimiento: ret.establecimiento.direccion }),
        ...(ret.emisor.contribuyenteEspecial && { contribuyenteEspecial: ret.emisor.contribuyenteEspecial }),
        obligadoContabilidad: ret.emisor.obligadoContabilidad ? 'SI' : 'NO',
        tipoIdentificacionSujetoRetenido: ret.sujetoRetenido.tipoIdentificacion,
        ...(ret.tipoSujetoRetenido && { tipoSujetoRetenido: ret.tipoSujetoRetenido }),
        parteRelacionada: ret.parteRelacionada || 'NO',
        razonSocialSujetoRetenido: ret.sujetoRetenido.razonSocial,
        identificacionSujetoRetenido: ret.sujetoRetenido.identificacion,
        periodoFiscal: ret.periodoFiscal,  // mm/aaaa
      },
      docsSustento: {
        docSustento: ret.documentosSustento.map(doc => ({
          codSustento: doc.codSustento,         // Código tipo documento
          codDocSustento: doc.codDocSustento,    // 01=factura, etc.
          numDocSustento: doc.numDocSustento,    // 001-001-000000001
          fechaEmisionDocSustento: formatDateSRI(doc.fechaEmision),
          fechaRegistroContable: formatDateSRI(doc.fechaRegistro || doc.fechaEmision),
          numAutDocSustento: doc.numAutorizacion,
          pagoLocExt: doc.pagoLocExt || '01',   // 01=Local, 02=Exterior
          totalSinImpuestos: doc.totalSinImpuestos.toFixed(2),
          importeTotal: doc.importeTotal.toFixed(2),
          impuestosDocSustento: {
            impuestoDocSustento: doc.impuestos.map(imp => ({
              codImpuestoDocSustento: imp.codigo,
              codigoPorcentaje: imp.codigoPorcentaje,
              baseImponible: imp.baseImponible.toFixed(2),
              tarifa: imp.tarifa.toFixed(2),
              valorImpuesto: imp.valorImpuesto.toFixed(2),
            })),
          },
          retenciones: {
            retencion: doc.retenciones.map(r => ({
              codigo: r.codigoImpuesto,           // 1=Renta, 2=IVA, 6=ISD
              codigoRetencion: r.codigoRetencion,  // Código del catálogo
              baseImponible: r.baseImponible.toFixed(2),
              porcentajeRetener: r.porcentaje.toFixed(2),
              valorRetenido: r.valorRetenido.toFixed(2),
            })),
          },
          pagos: {
            pago: doc.pagos.map(p => ({
              formaPago: p.formaPago,
              total: p.total.toFixed(2),
            })),
          },
        })),
      },
    },
  };

  if (ret.infoAdicional?.length > 0) {
    xmlObj.comprobanteRetencion.infoAdicional = {
      campoAdicional: ret.infoAdicional.map(c => ({
        '@_nombre': c.nombre,
        '#text': c.valor,
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}
```

## 4.4 Guía de Remisión — `buildGuiaRemisionXML()` (codDoc: 06, v1.0.0)

**Estructura única:**
- `<infoGuiaRemision>` con datos de transporte (partida, transportista, placa, fechas)
- `<destinatarios>` con múltiples destinos, cada uno con sus propios `<detalles>`
- No tiene impuestos ni totales monetarios

```javascript
/**
 * XML Guía de Remisión v1.0.0
 * Ficha Técnica SRI — Formato XML Guía de Remisión (pág. 53)
 */
export function buildGuiaRemisionXML(gr) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    guiaRemision: {
      '@_id': 'comprobante',
      '@_version': '1.0.0',
      infoTributaria: buildInfoTributaria({ ...gr, tipoComprobante: '06' }),
      infoGuiaRemision: {
        ...(gr.establecimiento.direccion && { dirEstablecimiento: gr.establecimiento.direccion }),
        dirPartida: gr.dirPartida,
        razonSocialTransportista: gr.transportista.razonSocial,
        tipoIdentificacionTransportista: gr.transportista.tipoIdentificacion,
        rucTransportista: gr.transportista.identificacion,
        ...(gr.emisor.obligadoContabilidad !== undefined && {
          obligadoContabilidad: gr.emisor.obligadoContabilidad ? 'SI' : 'NO',
        }),
        ...(gr.emisor.contribuyenteEspecial && { contribuyenteEspecial: gr.emisor.contribuyenteEspecial }),
        fechaIniTransporte: formatDateSRI(gr.fechaIniTransporte),
        fechaFinTransporte: formatDateSRI(gr.fechaFinTransporte),
        placa: gr.placa,
      },
      destinatarios: {
        destinatario: gr.destinatarios.map(dest => ({
          identificacionDestinatario: dest.identificacion,
          razonSocialDestinatario: dest.razonSocial,
          dirDestinatario: dest.direccion,
          motivoTraslado: dest.motivoTraslado,
          ...(dest.docAduaneroUnico && { docAduaneroUnico: dest.docAduaneroUnico }),
          ...(dest.codEstabDestino && { codEstabDestino: dest.codEstabDestino }),
          ...(dest.ruta && { ruta: dest.ruta }),
          ...(dest.codDocSustento && { codDocSustento: dest.codDocSustento }),
          ...(dest.numDocSustento && { numDocSustento: dest.numDocSustento }),
          ...(dest.numAutDocSustento && { numAutDocSustento: dest.numAutDocSustento }),
          ...(dest.fechaEmisionDocSustento && {
            fechaEmisionDocSustento: formatDateSRI(dest.fechaEmisionDocSustento),
          }),
          detalles: {
            detalle: dest.items.map(item => ({
              ...(item.codigoInterno && { codigoInterno: item.codigoInterno }),
              ...(item.codigoAdicional && { codigoAdicional: item.codigoAdicional }),
              descripcion: item.descripcion,
              cantidad: item.cantidad.toFixed(6),
            })),
          },
        })),
      },
    },
  };

  if (gr.infoAdicional?.length > 0) {
    xmlObj.guiaRemision.infoAdicional = {
      campoAdicional: gr.infoAdicional.map(c => ({
        '@_nombre': c.nombre,
        '#text': c.valor,
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}
```

## 4.5 Liquidación de Compra — `buildLiquidacionCompraXML()` (codDoc: 03, v1.1.0)

**Similar a Factura pero invertida:**
- El emisor compra al proveedor (que no está obligado a facturar)
- `<infoLiquidacionCompra>` con datos del proveedor en lugar del comprador
- Misma estructura de detalles e impuestos que una factura
- Incluye retenciones embebidas en el mismo documento

```javascript
/**
 * XML Liquidación de Compra v1.1.0
 * Ficha Técnica SRI — Anexo 17 (pág. 117)
 * 
 * ⚠️ codDoc = '03' (NO '08' como indicaba el plan original)
 */
export function buildLiquidacionCompraXML(lc) {
  const xmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    liquidacionCompra: {
      '@_id': 'comprobante',
      '@_version': '1.1.0',
      infoTributaria: buildInfoTributaria({ ...lc, tipoComprobante: '03' }),
      infoLiquidacionCompra: {
        fechaEmision: formatDateSRI(lc.fechaEmision),
        ...(lc.establecimiento.direccion && { dirEstablecimiento: lc.establecimiento.direccion }),
        ...(lc.emisor.contribuyenteEspecial && { contribuyenteEspecial: lc.emisor.contribuyenteEspecial }),
        obligadoContabilidad: lc.emisor.obligadoContabilidad ? 'SI' : 'NO',
        tipoIdentificacionProveedor: lc.proveedor.tipoIdentificacion,
        razonSocialProveedor: lc.proveedor.razonSocial,
        identificacionProveedor: lc.proveedor.identificacion,
        ...(lc.proveedor.direccion && { direccionProveedor: lc.proveedor.direccion }),
        totalSinImpuestos: lc.totalSinImpuestos.toFixed(2),
        totalDescuento: (lc.totalDescuento || 0).toFixed(2),
        totalConImpuestos: {
          totalImpuesto: lc.impuestos.map(imp => ({
            codigo: imp.codigo,
            codigoPorcentaje: imp.codigoPorcentaje,
            baseImponible: imp.baseImponible.toFixed(2),
            ...(imp.tarifa !== undefined && { tarifa: imp.tarifa.toFixed(2) }),
            valor: imp.valor.toFixed(2),
          })),
        },
        importeTotal: lc.importeTotal.toFixed(2),
        moneda: 'DOLAR',
        pagos: {
          pago: lc.pagos.map(p => ({
            formaPago: p.formaPago,
            total: p.total.toFixed(2),
            ...(p.plazo && { plazo: p.plazo }),
            ...(p.unidadTiempo && { unidadTiempo: p.unidadTiempo }),
          })),
        },
      },
      detalles: {
        detalle: lc.detalles.map(d => ({
          codigoPrincipal: d.codigoPrincipal,
          ...(d.codigoAuxiliar && { codigoAuxiliar: d.codigoAuxiliar }),
          descripcion: d.descripcion,
          cantidad: d.cantidad.toFixed(6),
          precioUnitario: d.precioUnitario.toFixed(6),
          descuento: (d.descuento || 0).toFixed(2),
          precioTotalSinImpuesto: d.precioTotalSinImpuesto.toFixed(2),
          impuestos: {
            impuesto: d.impuestos.map(imp => ({
              codigo: imp.codigo,
              codigoPorcentaje: imp.codigoPorcentaje,
              tarifa: imp.tarifa.toFixed(2),
              baseImponible: imp.baseImponible.toFixed(2),
              valor: imp.valor.toFixed(2),
            })),
          },
        })),
      },
    },
  };

  if (lc.infoAdicional?.length > 0) {
    xmlObj.liquidacionCompra.infoAdicional = {
      campoAdicional: lc.infoAdicional.map(c => ({
        '@_nombre': c.nombre,
        '#text': c.valor,
      })),
    };
  }

  return xmlBuilder.build(xmlObj);
}
```

---

# 5. CATÁLOGOS DE RETENCIÓN — Extensión de `catalogs.js`

## 5.1 Códigos de Retención en la Fuente de Renta (código impuesto: 1)

```javascript
// Agregar en src/lib/sri/catalogs.js

export const CODIGOS_RETENCION_RENTA = {
  '303': { descripcion: 'Honorarios profesionales', porcentaje: 10 },
  '304': { descripcion: 'Predomina intelecto', porcentaje: 8 },
  '304A': { descripcion: 'Predomina mano de obra', porcentaje: 2 },
  '304B': { descripcion: 'Entre sociedades', porcentaje: 2 },
  '304C': { descripcion: 'Publicidad y comunicación', porcentaje: 1 },
  '304D': { descripcion: 'Transporte privado', porcentaje: 1 },
  '304E': { descripcion: 'Mercantil y otros', porcentaje: 2 },
  '307': { descripcion: 'Predomina mano obra', porcentaje: 2 },
  '308': { descripcion: 'Predomina intelecto', porcentaje: 2 },
  '309': { descripcion: 'Publicidad y comunicación', porcentaje: 1 },
  '310': { descripcion: 'Transporte privado pasajeros/carga', porcentaje: 1 },
  '312': { descripcion: 'Transferencia bienes muebles', porcentaje: 1 },
  '319': { descripcion: 'Arrendamiento mercantil', porcentaje: 1 },
  '320': { descripcion: 'Arrendamiento inmuebles', porcentaje: 8 },
  '322': { descripcion: 'Seguros y reaseguros', porcentaje: 1 },
  '323': { descripcion: 'Rendimientos financieros', porcentaje: 2 },
  '325': { descripcion: 'Loterías, rifas, apuestas', porcentaje: 15 },
  '332': { descripcion: 'Pagos de bienes o servicios no sujetos', porcentaje: 0 },
  '340': { descripcion: 'Otras retenciones', porcentaje: 1.75 },
  '341': { descripcion: 'Convenio doble tributación', porcentaje: 0 },
  '343': { descripcion: 'Sin convenio doble tributación', porcentaje: 25 },
};

export const CODIGOS_RETENCION_IVA = {
  '1': { descripcion: 'IVA 10%', porcentaje: 10 },
  '2': { descripcion: 'IVA 20%', porcentaje: 20 },
  '3': { descripcion: 'IVA 30%', porcentaje: 30 },
  '4': { descripcion: 'IVA 50%', porcentaje: 50 },
  '5': { descripcion: 'IVA 70%', porcentaje: 70 },
  '6': { descripcion: 'IVA 100%', porcentaje: 100 },
  '7': { descripcion: 'Retención en cero', porcentaje: 0 },
  '9': { descripcion: 'No aplica retención', porcentaje: 0 },
  '10': { descripcion: 'IVA Presuntivo 12%', porcentaje: 12 },
};

export const CODIGOS_RETENCION_ISD = {
  '4580': { descripcion: 'ISD', porcentaje: 5 },
};

// Tipos de documento sustento para retenciones
export const TIPOS_DOC_SUSTENTO = {
  '01': 'Factura',
  '02': 'Nota de Venta - RISE',
  '03': 'Liquidación de Compra',
  '04': 'Nota de Crédito',
  '05': 'Nota de Débito',
  '06': 'Guía de Remisión',
  '07': 'Comprobante de Retención',
  '12': 'Documentos emitidos por IFIs',
  '15': 'Comprobantes de Venta emitidos en el Exterior',
  '19': 'Comprobantes de Pago Cuota RISE',
  '20': 'Documentos autorizados en el acuerdo de Cartagena',
  '21': 'Carta de porte aéreo',
  '41': 'Comprobante de Venta emitido por Reembolso',
  '42': 'Doc emitido por la Sociedad Residente / EP',
  '43': 'Liquidación de Seguros',
  '44': 'Acta de entrega-recepción',
  '45': 'Liquidación de compras títulos valores',
  '47': 'Nota de crédito del proveedor',
  '48': 'Nota de débito del proveedor',
};
```

---

# 6. INTEGRACIÓN CON IA — Prompts por Tipo de Comprobante

## 6.1 Archivo: `src/lib/ia/comprobante-prompts.js`

```javascript
/**
 * Prompts contextuales por tipo de comprobante
 * Gemini 3 Flash asiste según el tipo de documento
 */

export const PROMPTS_POR_TIPO = {
  '04': {  // Nota de Crédito
    system: `Eres un asistente de facturación electrónica del SRI de Ecuador.
Estás ayudando a crear una NOTA DE CRÉDITO.
Reglas:
- Siempre requiere una factura de referencia (doc sustento)
- La tarifa de IVA se toma de la fecha del documento de sustento, NO de la NC
- El motivo es OBLIGATORIO
- Puede ser anulación total (todos los items) o parcial (algunos items/cantidades)
- No puede superar el monto de la factura original
Sugiere motivos comunes: devolución de mercadería, descuento posterior, 
error en facturación, anulación de venta.`,
  },

  '05': {  // Nota de Débito
    system: `Eres un asistente de facturación electrónica del SRI de Ecuador.
Estás ayudando a crear una NOTA DE DÉBITO.
Reglas:
- Siempre requiere una factura de referencia (doc sustento)
- Se usa para cargos ADICIONALES (intereses, diferencias de precio, etc.)
- Cada cargo requiere una razón y un valor
- No tiene detalles con productos, sino motivos con valores
Sugiere razones comunes: intereses por mora, diferencia en precio, 
ajuste por tipo de cambio, cargo por servicio adicional.`,
  },

  '07': {  // Retención
    system: `Eres un asistente de facturación electrónica del SRI de Ecuador.
Estás ayudando a crear un COMPROBANTE DE RETENCIÓN.
Reglas:
- Se emite cuando se compra bienes/servicios y se retiene impuestos
- Requiere documento sustento (factura recibida del proveedor)
- Tipos de retención: Renta (código 1), IVA (código 2), ISD (código 6)
- El periodo fiscal es mes/año (mm/aaaa) de la retención
- Se debe emitir dentro de 5 días de recibido el comprobante de venta
- Codigos de retención más comunes: 303 (honorarios 10%), 312 (bienes muebles 1%), 
  340 (otras retenciones 1.75%), IVA 30% (código 3), IVA 70% (código 5), IVA 100% (código 6)
Ayuda al usuario a seleccionar los códigos correctos según el tipo de transacción.`,
  },

  '06': {  // Guía de Remisión
    system: `Eres un asistente de facturación electrónica del SRI de Ecuador.
Estás ayudando a crear una GUÍA DE REMISIÓN.
Reglas:
- Documenta el traslado de mercadería
- Requiere: dirección de partida, datos del transportista, placa del vehículo
- Fechas de inicio y fin de transporte
- Puede tener múltiples destinatarios, cada uno con sus propios items
- El motivo de traslado es obligatorio por destinatario
- Puede o no referenciar una factura como doc sustento
Motivos de traslado comunes: venta, compra, transformación, devolución, 
traslado entre establecimientos, importación, exportación.`,
  },

  '03': {  // Liquidación de Compra
    system: `Eres un asistente de facturación electrónica del SRI de Ecuador.
Estás ayudando a crear una LIQUIDACIÓN DE COMPRA.
Reglas:
- Se emite cuando se compra a personas NO obligadas a llevar contabilidad
  y que NO emiten comprobantes de venta
- Casos: servicios ocasionales, compra de productos agrícolas a campesinos,
  compra de artesanías, servicios de recicladores
- El emisor es quien COMPRA (tu empresa), el proveedor es quien VENDE
- Estructura de detalles e impuestos similar a una factura
- Puede incluir retenciones embebidas
- Requiere datos del proveedor: identificación, razón social, dirección`,
  },
};
```

---

# 7. ORQUESTADOR — Extensión para Múltiples Tipos

## 7.1 Modificaciones en `comprobante-orchestrator.js`

```javascript
// Agregar import de nuevos builders
import { buildNotaCreditoXML } from './xml-builder';
import { buildNotaDebitoXML } from './xml-builder';
import { buildRetencionXML } from './xml-builder';
import { buildGuiaRemisionXML } from './xml-builder';
import { buildLiquidacionCompraXML } from './xml-builder';

/**
 * Selecciona el XML builder según el tipo de comprobante
 */
function getXMLBuilder(tipoComprobante) {
  const builders = {
    '01': buildFacturaXML,
    '03': buildLiquidacionCompraXML,
    '04': buildNotaCreditoXML,
    '05': buildNotaDebitoXML,
    '06': buildGuiaRemisionXML,
    '07': buildRetencionXML,
  };

  const builder = builders[tipoComprobante];
  if (!builder) {
    throw new Error(`Tipo de comprobante no soportado: ${tipoComprobante}`);
  }
  return builder;
}

/**
 * Selecciona el template RIDE según el tipo de comprobante
 */
function getRIDETemplate(tipoComprobante) {
  const templates = {
    '01': 'factura',
    '03': 'liquidacion-compra',
    '04': 'nota-credito',
    '05': 'nota-debito',
    '06': 'guia-remision',
    '07': 'retencion',
  };
  return templates[tipoComprobante] || 'factura';
}

/**
 * Flujo principal extendido — soporta todos los tipos
 */
export async function procesarComprobante(comprobanteData) {
  const { tipoComprobante } = comprobanteData;
  const xmlBuilder = getXMLBuilder(tipoComprobante);

  // 1. Generar XML
  const xml = xmlBuilder(comprobanteData);

  // 2. Firmar (reutiliza xml-signer.js sin cambios)
  const xmlFirmado = await firmarXML(xml, comprobanteData.empresaId);

  // 3. Enviar al SRI (reutiliza soap-client.js sin cambios)
  const respRecepcion = await enviarAlSRI(xmlFirmado);

  // 4. Autorizar (reutiliza soap-client.js sin cambios)
  const respAutorizacion = await autorizarSRI(comprobanteData.claveAcceso);

  // 5. Generar RIDE (template según tipo)
  const rideTemplate = getRIDETemplate(tipoComprobante);
  const ridePDF = await generarRIDE(comprobanteData, rideTemplate);

  // 6. Enviar email (reutiliza resend-client.js sin cambios)
  await enviarEmail(comprobanteData, xmlFirmado, ridePDF);

  return { estado: respAutorizacion.estado, autorizacion: respAutorizacion };
}
```

---

# 8. COMPONENTES UI — Patrón de Formulario Reutilizable

## 8.1 Hook: `useComprobanteForm.js`

```javascript
/**
 * Hook genérico para formularios de comprobantes
 * Centraliza: validación, cálculos, submit, estados de carga
 */
import { useState, useCallback, useMemo } from 'react';
import { useEmpresaStore } from '@/stores/useEmpresaStore';

export function useComprobanteForm(tipoComprobante, options = {}) {
  const { empresa, establecimiento, puntoEmision } = useEmpresaStore();
  const [formData, setFormData] = useState(options.initialData || {});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const calcularTotales = useMemo(() => {
    // Lógica de cálculo varía por tipo, pero se centraliza aquí
    if (!formData.detalles?.length) return { subtotal: 0, iva: 0, total: 0 };

    const subtotal = formData.detalles.reduce(
      (sum, d) => sum + (d.cantidad * d.precioUnitario - (d.descuento || 0)), 0
    );

    // Calcular IVA por cada detalle según su tarifa
    const iva = formData.detalles.reduce((sum, d) => {
      const baseImponible = d.cantidad * d.precioUnitario - (d.descuento || 0);
      return sum + (baseImponible * (d.tarifaIVA || 0) / 100);
    }, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number((subtotal + iva).toFixed(2)),
    };
  }, [formData.detalles]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comprobantes/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoComprobante,
          empresaId: empresa.id,
          establecimientoId: establecimiento.id,
          puntoEmisionId: puntoEmision.id,
          ...formData,
        }),
      });
      return await response.json();
    } finally {
      setIsSubmitting(false);
    }
  }, [tipoComprobante, empresa, establecimiento, puntoEmision, formData]);

  return {
    formData, setFormData, updateField,
    errors, setErrors,
    isSubmitting, step, setStep,
    calcularTotales, submit,
    empresa, establecimiento, puntoEmision,
  };
}
```

## 8.2 Componente: `SeleccionarFacturaBase.jsx`

Componente compartido por NC, ND y Retención para seleccionar la factura de referencia:

```javascript
/**
 * Selector de factura base (documento sustento)
 * Usado por: Nota de Crédito, Nota de Débito, Retención
 * Busca facturas AUTORIZADAS de la empresa
 */
'use client';
import { useState, useEffect } from 'react';
import { GlassCard, GlassInput, GlassTable } from '@/components/ui';

export function SeleccionarFacturaBase({ onSelect, tipoDoc = 'todos' }) {
  const [facturas, setFacturas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarFacturas();
  }, [search]);

  async function buscarFacturas() {
    setLoading(true);
    const params = new URLSearchParams({
      estado: 'AUT',  // Solo autorizadas
      search,
      ...(tipoDoc !== 'todos' && { tipo: tipoDoc }),
    });
    const res = await fetch(`/api/comprobantes/buscar?${params}`);
    const data = await res.json();
    setFacturas(data.comprobantes || []);
    setLoading(false);
  }

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-medium uppercase tracking-wider mb-3">
        Seleccionar Documento de Referencia
      </h3>
      <GlassInput
        label="Buscar por número o cliente"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="001-001-000000001 o nombre cliente..."
      />
      <GlassTable
        columns={[
          { header: 'Número', accessor: 'numero_completo' },
          { header: 'Fecha', accessor: 'fecha_emision' },
          { header: 'Cliente', accessor: 'receptor_nombre' },
          { header: 'Total', accessor: 'total', format: 'currency' },
        ]}
        data={facturas}
        loading={loading}
        onRowClick={(factura) => onSelect(factura)}
        emptyMessage="No se encontraron facturas autorizadas"
      />
    </GlassCard>
  );
}
```

---

# 9. INTEGRACIÓN DE SUBAGENTES POR TAREA

## 9.1 Mapa de Subagentes y Skills por Módulo

| Módulo | SubAgente Principal | Skills | Tarea |
|---|---|---|---|
| Fix Bucket .p12 | `db-migrator` | `supabase-rls` | Políticas storage, verificar bucket |
| Migración 007 BD | `db-migrator` | `supabase-rls` | Tablas auxiliares, ALTER comprobantes |
| XML Builders (5) | `sri-validator` | `xml-sri` | Validar XML contra Ficha Técnica |
| Catálogos Retención | `sri-validator` | `xml-sri` | Códigos IR, IVA, ISD |
| Validadores | `sri-validator` | `xml-sri` | Reglas de negocio por tipo |
| Server Actions | `repo-scout` | `nextjs-patterns` | CRUD por tipo, validación Zod |
| Formularios UI | N/A (manual) | `glass-ui` | Ethereal Glass B&W, responsive |
| RIDE Templates (5) | N/A (manual) | `glass-ui` | PDF por tipo de comprobante |
| Prompts IA | N/A (manual) | - | System prompts contextuales |
| Tests | `test-writer` | Todos | Unit + Integration por tipo |

---

# 10. CRONOGRAMA DETALLADO — 15 DÍAS HÁBILES

| Día | Tarea | Módulo | SubAgente/Skill |
|-----|-------|--------|-----------------|
| 0 | **Fix firma electrónica:** bucket + políticas + test upload/firma/envío | Bloqueante | `db-migrator` + `supabase-rls` |
| 1 | Migración BD `007_comprobantes_adicionales.sql` + catálogos retención | BD | `db-migrator` + `supabase-rls` |
| 2 | XML Builder Nota de Crédito v1.1.0 + tests unitarios | Core SRI | `sri-validator` + `xml-sri` |
| 3 | XML Builder Nota de Débito v1.0.0 + tests unitarios | Core SRI | `sri-validator` + `xml-sri` |
| 4 | Formulario NC + Server Action + flujo completo NC (firmar/enviar/autorizar) | Full Stack | `glass-ui` + `nextjs-patterns` |
| 5 | Formulario ND + Server Action + flujo completo ND | Full Stack | `glass-ui` + `nextjs-patterns` |
| 6 | XML Builder Retención v2.0.0 + tests unitarios | Core SRI | `sri-validator` + `xml-sri` |
| 7 | Formulario Retención + Server Action (selector docs sustento + retenciones múltiples) | Full Stack | `glass-ui` + `nextjs-patterns` |
| 8 | Flujo completo Retención + test integración SRI pruebas | Core SRI | `sri-validator` |
| 9 | XML Builder Guía de Remisión v1.0.0 + tests unitarios | Core SRI | `sri-validator` + `xml-sri` |
| 10 | Formulario GR + Server Action (múltiples destinatarios + items) | Full Stack | `glass-ui` + `nextjs-patterns` |
| 11 | XML Builder Liquidación Compra v1.1.0 + Formulario + Server Action | Full Stack | `sri-validator` + `xml-sri` |
| 12 | RIDE Templates PDF (5 templates: NC, ND, Ret, GR, LC) | PDF | `glass-ui` |
| 13 | Listado unificado + filtros por tipo + IA contextual por tipo | Frontend + IA | `glass-ui` |
| 14 | Tests completos: unit XML builders + integration SOAP + SeleccionarFacturaBase | QA | `test-writer` |
| 15 | QA final + deploy staging + verificación todos los tipos en SRI pruebas | Deploy | `ci-cd-cloudrun` |

---

# 11. REGLAS DE NEGOCIO POR TIPO DE COMPROBANTE

## 11.1 Nota de Crédito

- Requiere factura autorizada como documento sustento
- El monto NO puede superar el total de la factura original
- La tarifa de IVA se toma de la fecha del doc sustento, NO de la fecha de la NC
- Se emite dentro del mismo periodo fiscal o hasta el periodo inmediato posterior
- Puede ser total (anula toda la factura) o parcial (algunos items/cantidades)

## 11.2 Nota de Débito

- Requiere factura autorizada como documento sustento
- Se usa exclusivamente para cargos adicionales sobre una venta existente
- No tiene detalles de productos, sino "motivos" (razón + valor)
- Cada motivo genera su propio cálculo de impuestos

## 11.3 Comprobante de Retención

- Debe emitirse dentro de los 5 días hábiles de recibido el comprobante de venta
- Puede agrupar múltiples documentos sustento en un solo comprobante
- Cada documento sustento puede tener múltiples retenciones (Renta + IVA + ISD)
- El periodo fiscal (mm/aaaa) es obligatorio
- Si el proveedor es persona natural: se retiene Renta e IVA
- Si el proveedor es sociedad: se retiene solo Renta (generalmente)

## 11.4 Guía de Remisión

- Necesaria para transportar mercadería entre establecimientos o a clientes
- Puede tener múltiples destinatarios con diferentes items cada uno
- No maneja valores monetarios ni impuestos
- La placa del vehículo es obligatoria
- Las fechas de inicio y fin de transporte son obligatorias
- Puede o no referenciar una factura como doc sustento

## 11.5 Liquidación de Compra

- Solo se emite cuando el proveedor NO está obligado a emitir comprobantes de venta
- El código SRI es `03` (NO `08`)
- Estructura similar a factura pero con datos del proveedor en lugar del comprador
- El emisor (tu empresa) es quien retiene los impuestos
- Aplica en: compras a campesinos, servicios ocasionales, recicladores

---

# 12. RIESGOS Y MITIGACIONES

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Bucket .p12 no funciona (bloquea todo) | **CRÍTICO** | Resolver Día 0 antes de cualquier otra tarea |
| Retención v2.0.0 tiene estructura compleja | ALTO | Implementar por partes: primero sin dividendos, luego agregar |
| Códigos retención desactualizados | MEDIO | Consultar catálogo ATS vigente del SRI antes de implementar |
| Guía de Remisión con múltiples destinatarios | MEDIO | Formulario dinámico con agregar/eliminar destinatarios |
| Liquidación de Compra es nicho | BAJO | Implementar última, puede simplificarse si no hay demanda |
| 5 templates RIDE es mucho trabajo | MEDIO | Plantilla base reutilizable, solo cambiar secciones específicas |

---

# 13. DEPENDENCIAS CRÍTICAS

```
Fase 4 depende de:
├── ✅ Fase 1 completada (auth, BD, CI/CD, componentes base)
├── ✅ Fase 2 completada (config empresa, .p12, clientes, productos, Gemini API)
├── ✅ Fase 3 completada (motor facturación: clave acceso, XML, firma, SOAP, RIDE, email)
├── 🔧 FIX: Bucket certificados en Supabase Storage (bloqueante)
├── 🔧 FIX: Políticas RLS de storage para .p12
├── 🔧 FIX: Lectura server-side con service_role_key
├── 🔑 GEMINI_API_KEY configurada (ya existe)
├── 🔑 RESEND_API_KEY configurada (ya existe)
├── 🔑 SRI_WS_RECEPCION_PRUEBAS URL configurada (ya existe)
├── 🔑 SRI_WS_AUTORIZACION_PRUEBAS URL configurada (ya existe)
├── 🔑 ENCRYPTION_KEY 32 caracteres (ya existe)
├── 📦 Dependencias npm: todas las de Fase 3 (sin nuevas)
└── 🔑 Certificado .p12 de prueba funcionando en Supabase Storage
```

---

# 14. CHECKLIST FINAL — FASE 4

## A. Pre-requisito (Día 0)
- [ ] Bucket `certificados` creado en Supabase Storage
- [ ] Políticas RLS de storage aplicadas
- [ ] Upload .p12 funciona desde el frontend
- [ ] Lectura .p12 funciona desde server-side (service_role)
- [ ] Firma XAdES genera XML firmado exitosamente
- [ ] Envío a WS Recepción SRI (pruebas) exitoso
- [ ] Email con XML + RIDE se envía correctamente

## B. Base de Datos
- [ ] Migración `007_comprobantes_adicionales.sql` aplicada
- [ ] CHECK constraint corregido (incluye '03')
- [ ] Tabla `retenciones_detalle` con RLS
- [ ] Tabla `guia_remision_destinatarios` con RLS
- [ ] Tabla `guia_remision_detalles` con RLS
- [ ] Campos adicionales en `comprobantes` (NC/ND/Ret/GR/LC)

## C. Nota de Crédito (codDoc: 04)
- [ ] XML Builder v1.1.0 genera XML válido
- [ ] Tests unitarios con vectores de la Ficha Técnica
- [ ] Formulario UI con selector de factura base
- [ ] Server Action: crear, firmar, enviar
- [ ] RIDE PDF template NC
- [ ] Autorización exitosa en SRI pruebas

## D. Nota de Débito (codDoc: 05)
- [ ] XML Builder v1.0.0 genera XML válido
- [ ] Tests unitarios con vectores de la Ficha Técnica
- [ ] Formulario UI con motivos dinámicos
- [ ] Server Action: crear, firmar, enviar
- [ ] RIDE PDF template ND
- [ ] Autorización exitosa en SRI pruebas

## E. Comprobante de Retención (codDoc: 07)
- [ ] XML Builder v2.0.0 genera XML válido
- [ ] Catálogos de retención (Renta, IVA, ISD) implementados
- [ ] Tests unitarios con vectores de la Ficha Técnica
- [ ] Formulario UI con docs sustento + retenciones múltiples
- [ ] Server Action: crear, firmar, enviar
- [ ] RIDE PDF template Retención
- [ ] Autorización exitosa en SRI pruebas

## F. Guía de Remisión (codDoc: 06)
- [ ] XML Builder v1.0.0 genera XML válido
- [ ] Tests unitarios con vectores de la Ficha Técnica
- [ ] Formulario UI con múltiples destinatarios
- [ ] Server Action: crear, firmar, enviar
- [ ] RIDE PDF template GR
- [ ] Autorización exitosa en SRI pruebas

## G. Liquidación de Compra (codDoc: 03)
- [ ] XML Builder v1.1.0 genera XML válido
- [ ] Tests unitarios con vectores de la Ficha Técnica
- [ ] Formulario UI con datos de proveedor
- [ ] Server Action: crear, firmar, enviar
- [ ] RIDE PDF template LC
- [ ] Autorización exitosa en SRI pruebas

## H. Integración
- [ ] Listado unificado filtra por todos los tipos
- [ ] Orquestador soporta todos los tipos
- [ ] IA contextual funciona por tipo de comprobante
- [ ] Email envía XML + RIDE para todos los tipos
- [ ] `npm run build` exitoso sin errores
- [ ] Deploy staging exitoso
- [ ] Verificación completa con WS SRI pruebas (todos los tipos)

---

# 15. RESUMEN EJECUTIVO

La **Fase 4** implementa los **5 comprobantes electrónicos adicionales** para facturIA, completando el catálogo completo de documentos electrónicos del SRI de Ecuador.

**Prioridad crítica antes de iniciar:** Resolver el bloqueo de firma electrónica (bucket .p12 en Supabase Storage). Sin esto, ningún comprobante puede ser firmado ni enviado al SRI.

**Reutilización:** ~90% de la infraestructura de la Fase 3 se reutiliza sin cambios (clave acceso, firma XAdES, cliente SOAP, email). Solo se extienden: XML builder (5 funciones nuevas), RIDE generator (5 templates), orquestador (switch por tipo), y se crean los formularios UI.

**Corrección importante:** El código SRI para Liquidación de Compra es `03` (confirmado en Ficha Técnica v2.32, Anexo 17), no `08` como indicaba el plan original. Se actualiza el CHECK constraint de la BD.

**Duración:** 15 días hábiles (3 semanas) + Día 0 para fix bloqueante  
**Modelo IA:** `gemini-3-flash-preview` con prompts contextuales por tipo  
**Entregables:** 5 comprobantes completos (XML + UI + RIDE + tests)  
**Resultado:** Todos los comprobantes electrónicos del SRI emitidos y autorizados en ambiente de pruebas
