<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-000?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-000?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-4-000?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Cloud_Run-Deploy-000?style=for-the-badge&logo=googlecloud" alt="Cloud Run" />
</p>

<h1 align="center">facturIA</h1>

<p align="center">
  Plataforma SaaS de facturacion electronica para Ecuador con Inteligencia Artificial.
  <br />
  Emite comprobantes autorizados por el SRI con asistencia de IA para reportes tributarios.
</p>

<p align="center">
  <strong>facturia.app</strong>
</p>

---

## Que es facturIA

facturIA es una plataforma SaaS que permite a empresas ecuatorianas emitir comprobantes electronicos autorizados por el SRI, con asistencia de Inteligencia Artificial para la generacion automatica de reportes tributarios (ATS, RDEP, formularios 103/104), analisis financiero y configuracion guiada.

El nombre fusiona "factura" + "IA", comunicando que la inteligencia artificial es parte central de la plataforma.

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16+ |
| UI | React | 19 |
| Lenguaje | JavaScript (ES2024) | - |
| CSS | Tailwind CSS | 4 |
| Temas | next-themes | 0.4 |
| Base de datos | PostgreSQL (Supabase) | 15 |
| Autenticacion | Supabase Auth | - |
| Almacenamiento | Supabase Storage | - |
| Estado global | Zustand | 5 |
| Validacion | Zod + React Hook Form | 4 / 7 |
| Animaciones | Framer Motion | 12 |
| Firma XML | XAdES-BES manual (crypto + node-forge) | - |
| Certificados | node-forge (PKCS#12) | 1.3 |
| Cifrado | crypto-js (AES-256) | 4 |
| PDF | react-pdf/renderer | 4.3 |
| Email | Resend | 4 |
| IA | Google Gemini API | 3.0 Flash |
| Despliegue | Google Cloud Run | - |
| CI/CD | GitHub Actions | - |

---

## Sistema de diseno

**Ethereal Glass** — un estilo visual etereo y minimalista con soporte de temas claro, oscuro y sistema.

### Modo oscuro (default)
```
Fondo:      #09090b (negro solido)
Glass:      rgba(255, 255, 255, 0.03-0.06) + backdrop-blur
Bordes:     rgba(255, 255, 255, 0.05-0.10)
Texto:      white con opacidades 0.90 / 0.55 / 0.30
Boton CTA:  fondo blanco, texto negro
```

### Modo claro
```
Fondo:      #fafafa (blanco solido)
Glass:      rgba(0, 0, 0, 0.02-0.04) + backdrop-blur
Bordes:     rgba(0, 0, 0, 0.07-0.10)
Texto:      negro con opacidades 0.90 / 0.55 / 0.35
Boton CTA:  fondo negro, texto blanco
```

Todos los colores se definen como variables CSS en `src/styles/globals.css` y cambian automaticamente segun el tema seleccionado. El toggle de tema esta disponible en el Topbar y en las paginas de autenticacion.

### Componentes UI

| Componente | Proposito |
|-----------|-----------|
| GlassCard | Contenedor con variantes y animacion |
| GlassButton | Primario, secundario, ghost, danger, accent |
| GlassInput | Input con label uppercase e icono |
| GlassSelect | Select con chevron |
| GlassModal | Modal con backdrop blur |
| GlassTable | Tabla con paginacion y loading |
| GlassAlert | Alertas diferenciadas por opacidad |
| GlassBadge | Estados SRI por nivel de brillo |
| ThemeToggle | Selector de tema (claro/oscuro/sistema) |

---

## Arquitectura

```
facturia.app (Google Cloud Run)
    |
    +-- Next.js 16 (App Router, SSR, Server Actions)
    |       |
    |       +-- /              Landing publica (Server Component con auth check)
    |       +-- /login         Autenticacion
    |       +-- /registro      Registro
    |       +-- /recuperar     Recuperar contrasena
    |       +-- /(dashboard)   Rutas protegidas
    |           +-- /onboarding        Wizard configuracion empresa (5 pasos)
    |           +-- /comprobantes      Listado y emision de comprobantes
    |           |   +-- /nuevo             Wizard nueva factura (5 pasos + IA)
    |           |   +-- /nota-credito      Formulario Nota de Credito
    |           |   +-- /nota-debito       Formulario Nota de Debito
    |           |   +-- /retencion         Formulario Comprobante de Retencion
    |           |   +-- /guia-remision     Formulario Guia de Remision
    |           |   +-- /liquidacion       Formulario Liquidacion de Compra
    |           |   +-- /[id]              Detalle de comprobante
    |           +-- /clientes          CRUD clientes (tabla, busqueda, CSV)
    |           +-- /productos         CRUD productos (tabla, IVA/ICE, CSV)
    |           +-- /reportes          Reportes SRI con IA
    |           +-- /configuracion     Hub de configuracion
    |               +-- /empresa           Datos del contribuyente
    |               +-- /establecimientos  CRUD establecimientos
    |               +-- /puntos-emision    CRUD puntos de emision
    |               +-- /certificado       Upload y gestion .p12
    |
    +-- Supabase
    |       +-- PostgreSQL 15 (15 tablas, RLS multi-tenant)
    |       +-- Auth (email/password, refresh tokens)
    |       +-- Storage (certificados .p12, cifrado AES-256)
    |
    +-- Google Gemini API (IA tributaria)
    |
    +-- SRI Ecuador (Web Services SOAP)
```

### Multi-tenant

Cada empresa opera en un espacio aislado mediante Row Level Security (RLS). Todas las tablas filtran por `empresa_id` a nivel de base de datos, imposibilitando el acceso cruzado entre empresas.

### Flujo de autenticacion

1. Usuario no autenticado en `/` ve la landing publica
2. Despues del login, `/` detecta auth y redirige automaticamente
3. Si no ha completado onboarding, va a `/onboarding` (wizard 5 pasos)
4. Si ya completo onboarding, va a `/comprobantes`
5. Rutas protegidas redirigen a `/login` si no hay sesion

---

## Base de datos

19 tablas con RLS habilitado, indices optimizados y funciones de negocio:

| Tabla | Proposito |
|-------|-----------|
| planes | Planes SaaS (starter, professional, enterprise) |
| empresas | Datos del contribuyente, suscripcion y estado de onboarding |
| establecimientos | Establecimientos del contribuyente |
| puntos_emision | Puntos de emision por establecimiento |
| secuenciales | Secuenciales por tipo de comprobante |
| certificados | Metadata de certificados .p12 (contrasena cifrada AES-256) |
| clientes | Clientes/receptores con validacion RUC/Cedula |
| productos | Catalogo con configuracion IVA/ICE |
| comprobantes | Comprobantes electronicos emitidos (6 tipos) |
| comprobante_detalles | Items de cada comprobante |
| comprobante_impuestos | Impuestos por detalle de comprobante |
| comprobante_pagos | Formas de pago por comprobante |
| retencion_detalles | Detalle de retenciones por documento sustento |
| guia_remision_destinatarios | Destinatarios de guias de remision |
| guia_remision_detalles | Items por destinatario de guia de remision |
| reportes_sri | ATS, RDEP y formularios generados |
| sri_log | Auditoria de comunicacion con el SRI |
| config_email | Configuracion de envio de correos |
| ia_conversaciones | Historial de chat con la IA |

**Vista**: `v_comprobantes_resumen` (resumen para dashboard con security_invoker)

**Storage**: Bucket `certificados` (privado, RLS, max 5MB, PKCS12)

---

## Funcionalidades implementadas

### Fase 1 - Fundacion
- Proyecto Next.js 16 con App Router y Tailwind 4
- Sistema de diseno Ethereal Glass (8 componentes UI)
- Layout responsive mobile-first (Sidebar, Topbar, BottomNav)
- Autenticacion Supabase (login, registro, recuperar, middleware)
- Schema BD multi-tenant con RLS (15 tablas)
- CI/CD con GitHub Actions hacia Cloud Run
- Landing page publica

### Fase 2 - Onboarding + Catalogos + Temas
- Sistema de temas: claro, oscuro y sistema (next-themes)
- Variables CSS para todos los componentes (sin colores hardcoded)
- Onboarding wizard de 5 pasos (empresa, establecimiento, punto emision, certificado, resumen)
- CRUD completo de empresa con validacion RUC Modulo 11
- CRUD de establecimientos y puntos de emision
- Upload y validacion de certificado .p12 con cifrado AES-256
- CRUD de clientes con tabla paginada, busqueda, filtros e importacion CSV
- CRUD de productos con configuracion IVA/ICE e importacion CSV
- Validacion de identificaciones ecuatorianas (RUC Modulo 11, Cedula Modulo 10)
- 4 subagentes Cursor con frontmatter correcto (repo-scout, sri-validator, test-writer, db-migrator)
- Redireccion inteligente post-login (onboarding o dashboard)

### Fase 3 - Motor de Facturacion Electronica
- Generador de clave de acceso (49 digitos + Modulo 11)
- XML Builder para factura electronica (v1.1.0 SRI)
- Firma electronica XAdES-BES completa (node-forge + crypto nativo, sin xml-crypto)
  - QualifyingProperties con SignedProperties (SigningTime, SigningCertificate, DataObjectFormat)
  - Canonicalizacion C14N 1.0 con namespaces heredados
  - Doble referencia: documento + SignedProperties
  - RSA-SHA1 con KeyInfo completo (X509Data + RSAKeyValue)
- Cliente SOAP para Web Services SRI (Recepcion y Autorizacion)
- Flujo completo orquestado: BORRADOR -> FIRMADO -> ENVIADO -> AUTORIZADO
- Reintentos de autorizacion configurables (10 intentos, 5s entre cada uno)
- Server Action reConsultarAutorizacion() para comprobantes en estado PPR
- Bucket de certificados en Supabase Storage con politicas RLS
- Admin client con service_role para bypass de RLS en Storage
- RIDE PDF (Representacion Impresa del Documento Electronico) con react-pdf
- Email automatico con XML + RIDE adjuntos (Resend)
- Wizard de factura con asistencia de IA (Gemini 3 Flash + useChat)
- Listado de comprobantes con filtros por estado y busqueda
- Manejo de codigo 70 SRI ("Clave de acceso en procesamiento")
- Logging completo de comunicacion con el SRI (sri_log)
- **Factura autorizada por el SRI en ambiente de pruebas** (verificado 6/Feb/2026)

### Fase 4 - Comprobantes Electronicos Adicionales
- **5 XML Builders nuevos**: Nota de Credito (04), Nota de Debito (05), Guia de Remision (06), Comprobante de Retencion (07), Liquidacion de Compra (03)
- **Catalogos SRI extendidos**: Retenciones Renta (303-343), Retenciones IVA (1-10), Retenciones ISD (4580), Documentos Sustento (01-48), Codigos IVA
- **5 validadores Zod**: Schemas de validacion para cada tipo de comprobante
- **12 Server Actions**: CRUD completo por tipo de comprobante + busqueda de documentos sustento
- **5 formularios UI completos**: Paginas de emision para NC, ND, Retencion, Guia Remision y Liquidacion
- **5 templates RIDE PDF**: Un template react-pdf por cada tipo de comprobante adicional
- **Orquestador multi-tipo**: El flujo procesarComprobante() ahora soporta los 6 tipos de comprobante
- **Selector dinamico de XML Builder y RIDE template** segun tipo de comprobante
- **Migraciones BD**: Tablas guia_remision_destinatarios, guia_remision_detalles, campos adicionales en comprobantes
- **Vista v_comprobantes_resumen** con security_invoker para dashboard
- **Componente SeleccionarDocumentoSustento**: Selector reutilizable de facturas autorizadas
- **42 tests unitarios** para los XML Builders de todos los tipos de comprobante
- **Correccion datos empresa**: obligadoContabilidad y regimen RIMPE segun consulta RUC SRI

---

## Comprobantes electronicos soportados

| Codigo | Tipo | Version XML | Estado |
|--------|------|-------------|--------|
| 01 | Factura | 1.1.0 | **AUTORIZADO por SRI** (firma + envio + RIDE + email) |
| 03 | Liquidacion de Compra | 1.1.0 | XML + formulario + RIDE (pendiente envio SRI) |
| 04 | Nota de Credito | 1.1.0 | XML + formulario + RIDE (pendiente envio SRI) |
| 05 | Nota de Debito | 1.0.0 | XML + formulario + RIDE (pendiente envio SRI) |
| 06 | Guia de Remision | 1.0.0 | XML + formulario + RIDE (pendiente envio SRI) |
| 07 | Comprobante de Retencion | 2.0.0 | XML + formulario + RIDE (pendiente envio SRI) |

### Flujo de emision
```
1. Crear borrador (formulario UI o IA)
2. Generar clave de acceso (49 digitos, Modulo 11)
3. Construir XML segun tipo (XML Builder con fast-xml-parser)
4. Firmar con XAdES-BES (certificado .p12)
5. Enviar al SRI via SOAP (RecepcionComprobantesOffline)
6. Consultar autorizacion con reintentos (AutorizacionComprobantesOffline, 10x5s)
7. Generar RIDE PDF (react-pdf/renderer)
8. Enviar email con XML + RIDE adjuntos (Resend)
```

### Firma Electronica XAdES-BES

El sistema implementa firma XAdES-BES (ETSI TS 101 903) conforme a la Ficha Tecnica del SRI Ecuador. La implementacion esta en `src/lib/sri/xml-signer.js` y realiza los siguientes pasos:

**1. Extraccion de credenciales (PKCS#12)**
- Se descarga el archivo `.p12` desde Supabase Storage usando el admin client (service_role)
- Se descifra la contrasena con AES-256
- Se extraen el certificado X.509, la clave privada RSA y la cadena en Base64 usando `node-forge`

**2. Digest del documento (C14N 1.0)**
- Se remueve la declaracion `<?xml?>` del comprobante
- Se expanden self-closing tags (`<tag/>` a `<tag></tag>`)
- Se computa SHA-1 del XML canonicalizado

**3. Construccion de SignedProperties (XAdES)**
- `SigningTime`: fecha/hora ISO de la firma
- `SigningCertificate`: digest SHA-1 del certificado DER + IssuerSerial (DN RFC 2253 + serial decimal)
- `DataObjectFormat`: referencia al comprobante con MimeType `text/xml`
- Se incluyen namespaces heredados (`xmlns:ds`, `xmlns:etsi`) para C14N correcto

**4. SignedInfo con doble referencia**
- **Referencia 1**: `URI="#comprobante"` con transform `enveloped-signature` (digest del documento)
- **Referencia 2**: `URI="#SignedProperties-{id}"` con `Type="http://uri.etsi.org/01903#SignedProperties"` (digest de las propiedades)

**5. Firma RSA-SHA1**
- Se canonicaliza el SignedInfo con namespaces heredados del Signature padre
- Se firma con `crypto.createSign('RSA-SHA1')` usando la clave privada PEM

**6. Ensamblaje de la firma**
- `ds:Signature` con `xmlns:ds` y `xmlns:etsi`
- `ds:KeyInfo` con `X509Certificate` y `RSAKeyValue` (Modulus + Exponent)
- `ds:Object` con `etsi:QualifyingProperties` conteniendo las SignedProperties
- Se inserta como ultimo hijo del elemento raiz del comprobante (enveloped)

**Resultado verificado**: Factura 001-001-000000001 autorizada por el SRI en ambiente de pruebas (6 de febrero de 2026).

---

## Planes de suscripcion

| | Starter | Professional | Enterprise |
|---|---------|-------------|------------|
| Precio | $9.99/mes | $24.99/mes | $49.99/mes |
| Comprobantes | 50/mes | 300/mes | Ilimitados |
| Usuarios | 1 | 5 | Ilimitados |
| Establecimientos | 1 | 3 | Ilimitados |
| ATS con IA | Si | Si | Si |
| Reportes avanzados | - | Si | Si |
| RDEP automatico | - | Si | Si |
| API access | - | - | Si |
| Multi-empresa | - | - | Si |

---

## Desarrollo local

### Requisitos

- Node.js 20+ (desarrollo local usa v25, Docker usa v20 LTS)
- Cuenta Supabase con proyecto configurado

### Instalacion

```bash
git clone https://github.com/israelgo93/FacturIA.git
cd FacturIA
npm install
```

### Variables de entorno

Crear `.env.local` en la raiz:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=facturIA
ENCRYPTION_KEY=tu-clave-aes-256-de-32-caracteres
RESEND_API_KEY=tu-resend-api-key
```

### Ejecutar

```bash
npm run dev       # Servidor de desarrollo en http://localhost:3000
npm run build     # Build de produccion
npm run lint      # Verificar codigo
```

---

## Estructura del proyecto

```
facturia/
+-- .cursor/                  Configuracion de agentes IA
|   +-- rules/                Reglas del proyecto (3)
|   +-- agents/               SubAgentes especializados (4)
|   +-- skills/               Conocimiento reutilizable (5)
|   +-- commands/             Workflows invocables (3)
+-- .github/workflows/        CI/CD (3 pipelines)
+-- public/                   Assets estaticos
+-- src/
|   +-- app/                  Rutas (App Router)
|   |   +-- (auth)/           Login, registro, recuperar
|   |   +-- (dashboard)/      Rutas protegidas
|   |   |   +-- clientes/     CRUD clientes (lista, nuevo, editar, importar)
|   |   |   +-- productos/    CRUD productos (lista, nuevo, editar, importar)
|   |   |   +-- configuracion/ Hub + empresa, establecimientos, puntos, certificado
|   |   |   +-- onboarding/   Wizard 5 pasos con componentes
|   |   +-- auth/callback/    Callback de confirmacion
|   +-- components/
|   |   +-- ui/               9 componentes Glass + ThemeToggle
|   |   +-- layout/           Sidebar, Topbar, BottomNav, MobileMenu
|   |   +-- shared/           Logo, LoadingSpinner, EmptyState
|   |   +-- providers/        ThemeProvider
|   |   +-- pages/            LandingPage
|   |   +-- pdf/              Templates RIDE (Factura, NC, ND, Ret, GR, LC)
|   |   +-- comprobantes/     Componentes compartidos (SeleccionarDocumentoSustento)
|   +-- lib/
|   |   +-- supabase/         Clientes browser, servidor y admin (service_role)
|   |   +-- validations/      Schemas Zod (auth, empresa, cliente, producto, comprobantes)
|   |   +-- utils/            Constantes, formatters, catalogos SRI
|   |   +-- crypto/           Cifrado AES-256
|   |   +-- sri/              Motor SRI: XML builders, firma XAdES-BES (C14N+RSA-SHA1), SOAP, orquestador
|   +-- stores/               Zustand (auth, empresa, UI)
|   +-- styles/               Tokens CSS con soporte de temas
+-- Dockerfile                Multi-stage build para Cloud Run
+-- Plan_FactuIA/             Documentacion de planificacion
```

---

## Agentes IA (Cursor)

4 subagentes especializados con frontmatter YAML para Cursor 2.4+:

| SubAgente | Rol |
|-----------|-----|
| repo-scout | Exploracion del codebase, busqueda de archivos y patrones |
| sri-validator | Validacion XML SRI, clave de acceso, catalogos tributarios |
| test-writer | Generacion de tests unitarios, integracion y E2E |
| db-migrator | Migraciones SQL, politicas RLS, verificacion de schema |

5 skills de conocimiento procedimental:

| Skill | Proposito |
|-------|-----------|
| supabase-rls | Patrones RLS multi-tenant |
| xml-sri | Generacion XML comprobantes electronicos |
| glass-ui | Sistema de diseno con soporte de temas |
| nextjs-patterns | Patrones Next.js 16+ con App Router |
| ci-cd-cloudrun | CI/CD GitHub Actions hacia Cloud Run |

---

## CI/CD

| Pipeline | Trigger | Destino |
|----------|---------|---------|
| ci.yml | Pull Request | Lint + Build |
| deploy-staging.yml | Push a develop | Cloud Run staging |
| deploy-production.yml | Push a main | Cloud Run produccion |

---

## Roadmap

| Fase | Descripcion | Estado |
|------|------------|--------|
| **Fase 1** | Fundacion: proyecto, UI, auth, BD, CI/CD | Completada |
| **Fase 2** | Temas, onboarding, config empresa, catalogos clientes/productos | Completada |
| **Fase 3** | Motor de facturacion electronica (firma, SRI, RIDE, email) | Completada |
| **Fase 4** | Comprobantes adicionales (NC, ND, Ret, GR, LC) + XML builders + RIDE | Completada |
| Fase 5 | Reportes IA + ATS/RDEP | Pendiente |
| Fase 6 | Dashboard analitico + suscripciones | Pendiente |
| Fase 7 | Produccion, testing y calidad | Pendiente |

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.
