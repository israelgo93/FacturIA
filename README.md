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
| Excel | SheetJS (xlsx) | 0.18 |
| Email | Resend | 6 |
| IA | Google Gemini API (ai SDK + @ai-sdk/google) | 3.0 Flash |
| Chat IA | Vercel AI SDK (@ai-sdk/react) | 3.x |
| Graficos | Recharts | 3.7 |
| Despliegue | Google Cloud Run | - |
| CI/CD | GitHub Actions | - |

---

## Sistema de diseno

**Ethereal Glass** -- un estilo visual etereo y minimalista con soporte de temas claro, oscuro y sistema.

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
    |           |   +-- /[id]              Detalle de comprobante (RIDE, XML, email)
    |           +-- /clientes          CRUD clientes (tabla, busqueda, CSV)
    |           +-- /productos         CRUD productos (tabla, IVA/ICE, CSV)
    |           +-- /compras           Registro compras recibidas (ATS)
    |           +-- /empleados         CRUD empleados (RDEP)
    |           +-- /reportes          Hub de reportes SRI con IA
    |           |   +-- /ats               Anexo Transaccional Simplificado
    |           |   +-- /rdep              Relacion Dependencia
    |           |   +-- /iva               Formulario 104 IVA
    |           |   +-- /retenciones       Formulario 103 Retenciones
    |           |   +-- /ventas            Reporte de ventas
    |           |   +-- /analisis          Chat IA tributario (streaming)
    |           +-- /configuracion     Hub de configuracion
    |               +-- /empresa           Datos del contribuyente
    |               +-- /establecimientos  CRUD establecimientos
    |               +-- /puntos-emision    CRUD puntos de emision
    |               +-- /certificado       Upload y gestion .p12
    |
    +-- Supabase
    |       +-- PostgreSQL 15 (23 tablas, RLS multi-tenant)
    |       +-- Auth (email/password, refresh tokens)
    |       +-- Storage (certificados .p12, cifrado AES-256)
    |
    +-- Google Gemini API (IA tributaria, chat streaming)
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

23 tablas con RLS habilitado, indices optimizados y funciones de negocio:

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
| compras_recibidas | Registro de compras/gastos de proveedores (ATS) |
| compras_recibidas_retenciones | Retenciones asociadas a compras recibidas |
| empleados | Empleados en relacion de dependencia (RDEP) |
| empleados_ingresos_anuales | Ingresos anuales por empleado (RDEP) |

**Vista**: `v_comprobantes_resumen` (resumen para dashboard con security_invoker)

**Funcion**: `calcular_total_ventas_periodo()` (ventas autorizadas por periodo)

**Storage**: Bucket `certificados` (privado, RLS, max 5MB, PKCS12)

---

## Fases de desarrollo (detalle)

### Fase 1 - Fundacion (Completada)

Infraestructura base del proyecto con autenticacion, base de datos y despliegue continuo.

- Proyecto Next.js 16 con App Router y Tailwind CSS 4
- Sistema de diseno Ethereal Glass (9 componentes UI reutilizables)
- Layout responsive mobile-first (Sidebar colapsable, Topbar, BottomNav mobile)
- Autenticacion completa con Supabase Auth (login, registro, recuperar contrasena, middleware)
- Schema de base de datos multi-tenant con Row Level Security (15 tablas iniciales)
- CI/CD con GitHub Actions: pipeline CI en pull requests, deploy staging en `develop`, deploy produccion en `main`
- Dockerfile multi-stage optimizado para Cloud Run (standalone output de Next.js)
- Landing page publica con deteccion automatica de sesion

### Fase 2 - Onboarding, Catalogos y Temas (Completada)

Configuracion inicial de la empresa y gestion de catalogos maestros.

- Sistema de temas: claro, oscuro y automatico del sistema (next-themes)
- Variables CSS para todos los componentes UI (sin colores hardcoded)
- Onboarding wizard de 5 pasos (datos empresa, establecimiento, punto de emision, certificado digital, resumen)
- CRUD completo de empresa con validacion RUC Modulo 11
- CRUD de establecimientos y puntos de emision
- Upload y validacion de certificado .p12 con cifrado AES-256 en Supabase Storage
- CRUD de clientes con tabla paginada, busqueda global, filtros por tipo e importacion CSV masiva
- CRUD de productos con configuracion IVA/ICE por producto e importacion CSV masiva
- Validacion de identificaciones ecuatorianas (RUC Modulo 11, Cedula Modulo 10)
- 4 subagentes Cursor especializados (repo-scout, sri-validator, test-writer, db-migrator)
- 5 skills de conocimiento procedimental (supabase-rls, xml-sri, glass-ui, nextjs-patterns, ci-cd-cloudrun)
- Redireccion inteligente post-login (onboarding pendiente o dashboard)

### Fase 3 - Motor de Facturacion Electronica (Completada)

Motor completo de emision de facturas con firma digital, comunicacion SRI, RIDE y email.

- Generador de clave de acceso de 49 digitos con digito verificador Modulo 11
- XML Builder para factura electronica (version 1.1.0 conforme a Ficha Tecnica SRI)
- Firma electronica XAdES-BES completa con node-forge y crypto nativo:
  - QualifyingProperties con SignedProperties (SigningTime, SigningCertificate, DataObjectFormat)
  - Canonicalizacion C14N 1.0 con namespaces heredados
  - Doble referencia: documento + SignedProperties
  - RSA-SHA1 con KeyInfo completo (X509Data + RSAKeyValue)
- Cliente SOAP para Web Services SRI (RecepcionComprobantesOffline y AutorizacionComprobantesOffline)
- Flujo de emision orquestado: BORRADOR -> FIRMADO -> ENVIADO -> AUTORIZADO
- Reintentos de autorizacion configurables (10 intentos, 5 segundos entre cada uno)
- Server Action reConsultarAutorizacion() para comprobantes en estado PPR (procesamiento)
- Bucket de certificados en Supabase Storage con politicas RLS por empresa
- Admin client con service_role para bypass de RLS en operaciones de Storage
- RIDE PDF con react-pdf (Representacion Impresa del Documento Electronico)
- Email automatico con XML + RIDE adjuntos usando Resend
- Wizard de factura con asistencia de IA (Google Gemini 3 Flash + useChat)
- Listado de comprobantes con filtros por estado, busqueda y paginacion
- Manejo del codigo 70 del SRI ("Clave de acceso en procesamiento")
- Logging completo de comunicacion con el SRI en tabla sri_log
- **Factura autorizada por el SRI en ambiente de pruebas** (verificado 6/Feb/2026)

### Fase 4 - Comprobantes Electronicos Adicionales (Completada)

Soporte completo para los 6 tipos de comprobantes electronicos del SRI Ecuador.

- 5 XML Builders nuevos: Nota de Credito (04), Nota de Debito (05), Guia de Remision (06), Comprobante de Retencion (07), Liquidacion de Compra (03)
- Catalogos SRI extendidos: Retenciones Renta (303-343), Retenciones IVA (1-10), Retenciones ISD (4580), Documentos Sustento (01-48), Codigos IVA
- 5 schemas de validacion Zod: uno para cada tipo de comprobante adicional
- 12 Server Actions: CRUD completo por tipo de comprobante + busqueda de documentos sustento
- 5 formularios UI completos: paginas de emision para NC, ND, Retencion, Guia Remision y Liquidacion
- 5 templates RIDE PDF: un template react-pdf por cada tipo de comprobante adicional
- Orquestador multi-tipo: procesarComprobante() ahora soporta los 6 tipos
- Selector dinamico de XML Builder y RIDE template segun tipo de comprobante
- Migraciones BD: tablas guia_remision_destinatarios, guia_remision_detalles, campos adicionales en comprobantes
- Vista v_comprobantes_resumen con security_invoker para dashboard
- Componente SeleccionarDocumentoSustento: selector reutilizable de facturas autorizadas
- 42 tests unitarios para los XML Builders de todos los tipos de comprobante
- Correccion datos empresa: obligadoContabilidad y regimen RIMPE segun consulta RUC SRI

### Fase 5 - Reportes IA, ATS y RDEP (Completada)

Generacion automatica de reportes tributarios con analisis de Inteligencia Artificial.

**Base de datos (4 tablas nuevas, 1 funcion, 5 indices)**
- Tabla compras_recibidas: registro de compras y gastos de proveedores para ATS
- Tabla compras_recibidas_retenciones: retenciones en compras recibidas
- Tabla empleados: empleados en relacion de dependencia para RDEP
- Tabla empleados_ingresos_anuales: ingresos anuales por empleado
- Funcion calcular_total_ventas_periodo() para consulta de ventas autorizadas
- Indices de rendimiento en empresa+periodo, proveedor, compra_id
- RLS habilitado en las 4 tablas nuevas con triggers updated_at

**Catalogos y utilidades**
- Catalogos ATS completos: Tipo ID Proveedor (Tabla 2), Tipo Comprobante (Tabla 4), Codigo Sustento (Tabla 5), Forma Pago (Tabla 13)
- Modulo de vencimientos tributarios: calculo por noveno digito del RUC con estados (normal, proximo, urgente, vencido)
- Funciones helper: calcularVencimiento(), diasParaVencimiento(), infoVencimiento()

**CRUD Compras y Empleados**
- CRUD compras recibidas con todos los campos ATS (tipo ID, codigo sustento, forma pago, bases imponibles, IVA, ICE, parte relacionada)
- CRUD empleados con tipos de contrato (indefinido, fijo, eventual, ocasional) e ingresos anuales
- Listados con GlassTable, busqueda, paginacion y modales de registro

**Motor de reportes (6 consolidadores/builders)**
- Consolidador ATS: recopila compras, ventas por establecimiento, resumen (excluye compras con retencion electronica)
- Constructor XML ATS compatible con at.xsd: modulo compras (codSustento, tpIdProv, bases, retenciones AIR/IVA), ventas por establecimiento, formas de pago
- Constructor XML RDEP compatible con RDEP.xsd: periodos de trabajo, ingresos gravados, IESS, gastos personales
- Consolidador Formulario 104 IVA: casilleros oficiales (ventas gravadas, tarifa 0, no objeto, exentas, credito tributario, liquidacion)
- Consolidador Formulario 103 Retenciones: agrupacion por codigo de retencion, combina retenciones electronicas y manuales
- Generador Reporte de Ventas: detalle y resumen (facturas, NC, ND autorizados, ventas brutas/netas, IVA)

**Exportacion Excel**
- Dependencia xlsx (SheetJS) integrada
- Exportadores: ATS Excel (hojas Resumen + Compras), Form 104, Form 103, Ventas (detalle + resumen)

**Inteligencia Artificial**
- Motor de analisis tributario: deteccion algoritmica de anomalias (vencimientos, consistencia IVA, retenciones faltantes, bancarizacion)
- Analisis avanzado con Google Gemini 3 Flash (con fallback automatico si falla la API)
- API route de chat streaming con Vercel AI SDK: contexto fiscal automatico del periodo
- Prompts especializados en tributacion ecuatoriana (system prompt con datos de empresa + reglas SRI)
- Chat IA en tiempo real con selector de periodo y contexto fiscal dinamico

**Paginas UI (8 nuevas)**
- Hub de reportes con 6 cards de acceso rapido
- Pagina ATS: selector periodo, generar/descargar XML y Excel, resumen con metricas
- Pagina RDEP: selector anio, generar/descargar XML, previsualizacion
- Pagina Form 104 IVA: casilleros oficiales con formato, liquidacion con colores, exportar Excel
- Pagina Form 103 Retenciones: tablas renta e IVA, total a pagar, exportar Excel
- Pagina Ventas: cards resumen, tabla detalle, exportar Excel
- Pagina Analisis IA: chat streaming con Gemini, selector periodo
- Pagina Compras: listado con modal de registro
- Pagina Empleados: listado con modal de registro

**Navegacion**
- Sidebar y MobileMenu actualizados con entradas Compras y Empleados

**Acciones de comprobante mejoradas**
- Boton Ver RIDE PDF en detalle de comprobante (abre en nueva pestana)
- Boton Descargar XML (descarga directa del XML autorizado o firmado)
- Boton Enviar por Email (envia RIDE + XML al email del comprador)

**Migracion Chat IA a AI SDK v6**
- API route migrada a convertToModelMessages() para compatibilidad con UIMessage
- Frontend migrado a sendMessage, DefaultChatTransport y status (reemplaza handleSubmit/isLoading)
- Renderizado de mensajes con parts (type text) en lugar de content
- Card de acceso rapido al Asistente Tributario IA en el Dashboard

**Correccion de estados en ComprobanteTimeline**
- Fix: estado Autorizado (AUT) ahora muestra CheckCircle verde en lugar de Clock
- Logica completadoFinal para manejar el caso especial del ultimo paso del timeline
- StatusBadge con color accent para estado AUT

**Responsive mobile-first**
- GlassTable con nueva prop mobileCard: vista de cards en movil, tabla en desktop
- Cards responsive en Clientes (razon social, ID, tipo, email, estado, acciones)
- Cards responsive en Productos (nombre, codigo, precio, IVA, categoria, estado)
- Cards responsive en Compras (proveedor, ID, fecha, base IVA, monto IVA)
- Cards responsive en Empleados (nombre, ID, cargo, sueldo, estado)
- ComprobanteList con vistas separadas desktop (grid-cols-12) y mobile (cards compactas)
- ComprobanteDetalle con header responsive (flex-col en movil, flex-row en desktop)
- Formularios de comprobantes con grid-cols-1 md:grid-cols-2 (ya responsive)

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# SRI Web Services
SRI_AMBIENTE=1
SRI_WS_RECEPCION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WS_AUTORIZACION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
SRI_WS_RECEPCION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WS_AUTORIZACION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl

# Seguridad
ENCRYPTION_KEY=tu-clave-aes-256-de-32-caracteres

# Inteligencia Artificial
GEMINI_API_KEY=tu-gemini-api-key
GOOGLE_GENERATIVE_AI_API_KEY=tu-gemini-api-key

# Email
RESEND_API_KEY=tu-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=facturIA
```

### Ejecutar

```bash
npm run dev       # Servidor de desarrollo en http://localhost:3000
npm run build     # Build de produccion
npm run lint      # Verificar codigo
npm run test      # Tests unitarios (vitest)
```

---

## Guia de despliegue a Google Cloud Run

Esta guia describe paso a paso como configurar el despliegue automatico a Google Cloud Run usando GitHub Actions. Todo se hace desde las interfaces web (Google Cloud Console y GitHub), sin necesidad de usar la linea de comandos.

### Paso 1: Crear proyecto en Google Cloud

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Click en el selector de proyectos (arriba a la izquierda) y luego **Nuevo Proyecto**
3. Nombre: `facturia-prod` (debe coincidir con `PROJECT_ID` en los workflows)
4. Click **Crear**
5. Seleccionar el proyecto recien creado

### Paso 2: Habilitar las APIs necesarias

1. En el menu lateral: **APIs y servicios** > **Biblioteca**
2. Buscar y habilitar cada una de estas APIs:
   - **Cloud Run Admin API**
   - **Artifact Registry API**
   - **Cloud Build API**
   - **IAM Service Account Credentials API**
   - **Secret Manager API**

### Paso 3: Crear repositorio en Artifact Registry

1. Menu lateral: **Artifact Registry** > **Repositorios**
2. Click **Crear repositorio**
3. Configurar:
   - Nombre: `facturia`
   - Formato: **Docker**
   - Modo: **Estandar**
   - Region: `us-east1` (debe coincidir con `REGION` en los workflows)
   - Cifrado: **Clave administrada por Google**
4. Click **Crear**

### Paso 4: Crear cuenta de servicio para GitHub Actions

1. Menu lateral: **IAM y administracion** > **Cuentas de servicio**
2. Click **Crear cuenta de servicio**
3. Configurar:
   - Nombre: `github-actions-deploy`
   - ID: `github-actions-deploy`
   - Descripcion: "Cuenta para despliegues desde GitHub Actions"
4. Click **Crear y continuar**
5. Asignar los siguientes roles (agregar uno por uno con "Agregar otro rol"):
   - `Artifact Registry Writer` (roles/artifactregistry.writer)
   - `Cloud Run Admin` (roles/run.admin)
   - `Service Account User` (roles/iam.serviceAccountUser)
   - `Secret Manager Secret Accessor` (roles/secretmanager.secretAccessor)
6. Click **Listo**

### Paso 5: Generar clave JSON de la cuenta de servicio

1. En la lista de cuentas de servicio, click en `github-actions-deploy`
2. Ir a la pestana **Claves**
3. Click **Agregar clave** > **Crear clave nueva**
4. Seleccionar **JSON** y click **Crear**
5. Se descarga un archivo `.json` -- **guardarlo de forma segura**, se usara en GitHub

### Paso 6: Crear secretos en Google Secret Manager

1. Menu lateral: **Seguridad** > **Secret Manager**
2. Click **Crear secreto** para cada uno de los siguientes (nombre exacto):

| Nombre del secreto | Valor |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key de Supabase |
| `ENCRYPTION_KEY` | Clave AES-256 de 32 caracteres |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Misma API key de Gemini |
| `RESEND_API_KEY` | API key de Resend |
| `SRI_AMBIENTE` | `1` (pruebas) o `2` (produccion) |
| `SRI_WS_RECEPCION_PRUEBAS` | URL WSDL recepcion pruebas |
| `SRI_WS_AUTORIZACION_PRUEBAS` | URL WSDL autorizacion pruebas |
| `SRI_WS_RECEPCION_PROD` | URL WSDL recepcion produccion |
| `SRI_WS_AUTORIZACION_PROD` | URL WSDL autorizacion produccion |

3. Para cada secreto: poner el nombre, pegar el valor y click **Crear version del secreto**

### Paso 7: Configurar secretos en GitHub

1. Ir al repositorio en GitHub: `github.com/israelgo93/FacturIA`
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** para cada uno:

| Nombre del secreto en GitHub | Valor |
|---|---|
| `GCP_SA_KEY` | Contenido COMPLETO del archivo JSON descargado en el Paso 5 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL de produccion (ej: `https://facturia-app-xxxxx-ue.a.run.app`) |
| `NEXT_PUBLIC_APP_URL_STAGING` | URL de staging (se obtiene despues del primer deploy) |

**Nota**: Las variables `NEXT_PUBLIC_*` se necesitan en build-time porque Next.js las embebe en el bundle del cliente. Los demas secretos (Supabase service role, Gemini, Resend, etc.) se inyectan en runtime via Secret Manager de GCP.

### Paso 8: Primer despliegue

El despliegue se activa automaticamente cuando se hace push a la rama correspondiente:

- **Push a `main`**: Despliega a produccion (`facturia-app`)
- **Push a `develop`**: Despliega a staging (`facturia-staging`)

Para verificar:
1. En GitHub: ir a **Actions** y ver el workflow ejecutandose
2. Una vez completado, en Google Cloud Console: **Cloud Run** > click en el servicio
3. Copiar la URL del servicio (formato: `https://facturia-app-xxxxx-ue.a.run.app`)
4. **Importante**: Volver a GitHub y actualizar el secreto `NEXT_PUBLIC_APP_URL` con esta URL real

### Paso 9: Configurar dominio personalizado (opcional)

1. En Cloud Run, click en el servicio desplegado
2. Ir a la pestana **Dominios**
3. Click **Agregar asignacion**
4. Seguir las instrucciones para verificar el dominio y configurar los registros DNS

### Verificacion post-despliegue

Despues del primer despliegue exitoso, verificar:

- [ ] La aplicacion carga correctamente en la URL de Cloud Run
- [ ] Login y registro funcionan (Supabase Auth)
- [ ] Las variables de entorno se inyectan correctamente (verificar en Cloud Run > Revisiones > Variables)
- [ ] Los secretos de Secret Manager se montan correctamente
- [ ] El certificado .p12 se puede subir y usar para firmar

### Resumen de la infraestructura

```
GitHub (repositorio)
    |
    +-- Push a main --> GitHub Actions (deploy-production.yml)
    |                       |
    |                       +-- Build Docker image con NEXT_PUBLIC_* como build-args
    |                       +-- Push imagen a Artifact Registry (us-east1)
    |                       +-- Deploy a Cloud Run con secretos de Secret Manager
    |
    +-- Push a develop --> GitHub Actions (deploy-staging.yml)
    |                       |
    |                       +-- Mismo flujo, servicio facturia-staging
    |
    +-- Pull Request --> GitHub Actions (ci.yml)
                            |
                            +-- npm ci + lint + build (validacion)
```

### Notas importantes

- El Dockerfile usa `output: 'standalone'` de Next.js para crear una imagen optimizada (~150MB)
- Las variables `NEXT_PUBLIC_*` deben pasarse como `--build-arg` durante el build de Docker
- Los secretos sensibles se gestionan via Google Secret Manager (no como env vars en Cloud Run)
- El servicio de produccion tiene `min-instances: 0` para optimizar costos (cold start ~3s)
- Staging tiene `max-instances: 3` y produccion `max-instances: 10`

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
|   |   |   +-- compras/      Registro compras recibidas
|   |   |   +-- empleados/    CRUD empleados
|   |   |   +-- reportes/     Hub + ATS, RDEP, IVA, Retenciones, Ventas, Analisis IA
|   |   |   +-- configuracion/ Hub + empresa, establecimientos, puntos, certificado
|   |   |   +-- onboarding/   Wizard 5 pasos con componentes
|   |   +-- api/              Rutas API
|   |   |   +-- comprobantes/ RIDE PDF, email
|   |   |   +-- reportes/     Chat IA streaming
|   |   |   +-- ia/           Factura wizard IA
|   |   +-- auth/callback/    Callback de confirmacion
|   +-- components/
|   |   +-- ui/               9 componentes Glass + ThemeToggle
|   |   +-- layout/           Sidebar, Topbar, BottomNav, MobileMenu
|   |   +-- shared/           Logo, LoadingSpinner, EmptyState
|   |   +-- providers/        ThemeProvider
|   |   +-- pages/            LandingPage
|   |   +-- pdf/              Templates RIDE (Factura, NC, ND, Ret, GR, LC)
|   |   +-- comprobantes/     Componentes compartidos (SeleccionarDocumentoSustento, ComprobanteDetalle)
|   |   +-- reportes/         PeriodoSelector
|   +-- lib/
|   |   +-- supabase/         Clientes browser, servidor y admin (service_role)
|   |   +-- validations/      Schemas Zod (auth, empresa, cliente, producto, comprobantes, compras, empleados)
|   |   +-- utils/            Constantes, formatters, catalogos SRI, vencimientos
|   |   +-- crypto/           Cifrado AES-256
|   |   +-- sri/              Motor SRI: XML builders, firma XAdES-BES (C14N+RSA-SHA1), SOAP, orquestador
|   |   +-- reportes/         ATS builder/consolidator, RDEP builder, Form 103/104, ventas, Excel
|   |   +-- ia/               Prompts IA, analisis tributario
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
| ci.yml | Pull Request | Lint + Build (validacion) |
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
| **Fase 5** | Reportes IA + ATS/RDEP + compras + empleados + chat tributario | Completada |
| Fase 6 | Dashboard analitico + suscripciones | Pendiente |
| Fase 7 | Produccion, testing y calidad | Pendiente |

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.
