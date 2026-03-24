<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-000?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-000?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-4-000?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/App_Runner-Deploy-000?style=for-the-badge&logo=amazonaws" alt="App Runner" />
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
| PWA / Service Worker | Serwist (@serwist/turbopack) | 10+ |
| Despliegue | AWS App Runner (ECR) | - |
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
| GlassButton | Primario, secundario, ghost, danger, accent. Touch feedback (active:scale) y min-height 44px |
| GlassInput | Input con label uppercase e icono. text-base en movil para prevenir zoom iOS |
| GlassSelect | Select con chevron. text-base en movil para prevenir zoom iOS |
| GlassModal | Modal centrado en desktop, bottom-sheet con animacion spring en movil |
| GlassTable | Tabla con paginacion, loading y botones touch-target (44px) |
| GlassAlert | Alertas diferenciadas por opacidad |
| StatusBadge | Estados SRI, CRUD y suscripcion (variables semanticas) |
| ThemeToggle | Selector de tema (claro/oscuro/sistema) |

---

## PWA (Progressive Web App)

facturIA es una PWA instalable en dispositivos moviles y escritorio. La configuracion incluye:

### Manifest
- `public/manifest.json` con `display: "standalone"`, `start_url: "/dashboard"`, `scope: "/"`
- Iconos PWA en `public/icons/` (192x192, 512x512, maskable, apple-touch-icon)

### Service Worker (Serwist + Turbopack)
- Integrado con `@serwist/turbopack` para compatibilidad nativa con Next.js 16 y Turbopack
- Route handler en `src/app/serwist/[path]/route.js` genera y sirve `sw.js`
- Estrategias de cache: NetworkFirst (paginas), StaleWhileRevalidate (JS/CSS), CacheFirst (imagenes/fuentes)
- Precache automatico de todas las paginas estaticas (67 entries)
- `SerwistProvider` en el layout raiz para registro automatico del SW

### Soporte Offline
- Pagina fallback en `/~offline` cuando no hay conexion
- El service worker intercepta navegacion y sirve contenido cacheado
- `navigationPreload`, `skipWaiting` y `clientsClaim` habilitados

### Meta tags PWA
- `manifest`, `themeColor`, `appleWebApp` (capable, statusBarStyle) configurados en metadata de Next.js
- `viewport` con `viewportFit: cover` para safe areas en iOS
- Apple touch icon en raiz y en `/icons/`

---

## Arquitectura

```
facturia.app (AWS App Runner — us-east-1)
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
    |           +-- /dashboard       Dashboard analitico (KPIs, Recharts, IA, vencimientos)
    |           +-- /suscripcion     Portal de plan y limites (sin pasarela)
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
    |       +-- PostgreSQL 15 (26 tablas, RLS multi-tenant)
    |       +-- Auth (email/password, refresh tokens)
    |       +-- Storage (certificados .p12, cifrado AES-256)
    |
    +-- Google Gemini API — gemini-3-flash-preview (principal) + gemini-2.5-flash (fallback)
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

26 tablas (23 originales + 3 Fase 6) con RLS habilitado, indices optimizados y funciones de negocio:

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
| suscripciones | Plan activo por empresa, estado trial/activa/suspendida/cancelada, uso mensual |
| notificaciones | Alertas (vencimiento, limite plan, certificado, SRI, etc.) |
| dashboard_cache | Cache JSON de metricas por empresa y periodo YYYY-MM |

**Vista**: `v_comprobantes_resumen` (resumen para dashboard con security_invoker)

**Funciones**: `calcular_total_ventas_periodo()` (ventas autorizadas por periodo); Fase 6: `contar_comprobantes_mes`, `verificar_limite_plan`, `calcular_metricas_dashboard` (requieren migracion aplicada en Supabase).

**Migracion Fase 6**: `supabase/migrations/20260323140000_dashboard_suscripciones_fase6.sql` (tablas + RLS + funciones SECURITY DEFINER + seed planes y suscripciones trial).

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
- CI/CD con GitHub Actions: pipeline CI en pull requests, deploy produccion en `main` via ECR + App Runner
- Dockerfile multi-stage optimizado para App Runner (standalone output de Next.js)
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
- 5 skills de conocimiento procedimental (supabase-rls, xml-sri, glass-ui, nextjs-patterns, ci-cd-apprunner)
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
- Pagina Compras: listado; registro en pagina `/compras/nuevo`
- Pagina Empleados: listado; registro en pagina `/empleados/nuevo`

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
- Pasos completados con CheckCircle en `--text-secondary` (Fase 6: sin verde decorativo)
- Logica completadoFinal para el ultimo paso del timeline
- StatusBadge semantico para estado AUT

### Fase 5.1 - PWA Completa (Completada)

Configuracion completa de Progressive Web App con service worker, cache offline e instalacion nativa.

- Service worker con Serwist (@serwist/turbopack) compatible con Next.js 16 y Turbopack
- Route handler `src/app/serwist/[path]/route.js` para generacion dinamica del SW
- Precache automatico de 67 paginas estaticas con versionado por git commit
- Estrategias de cache: NetworkFirst (HTML), StaleWhileRevalidate (JS/CSS), CacheFirst (imagenes)
- SerwistProvider en layout raiz para registro automatico del service worker
- Manifest PWA completo: id, scope, start_url, display standalone, orientation, categories
- Iconos PWA generados: 192x192, 512x512, maskable-512x512, apple-touch-icon (180x180)
- Meta tags PWA en Next.js metadata: manifest link, appleWebApp, icons, mobile-web-app-capable
- Viewport con themeColor y viewportFit cover para safe areas iOS
- Pagina offline fallback `/~offline` con diseno Glass UI (icono WifiOff + boton reintentar)
- navigationPreload, skipWaiting y clientsClaim habilitados para actualizacion inmediata del SW
- Matcher del proxy actualizado para excluir rutas de serwist
- .gitignore actualizado para excluir archivos SW generados

**Responsive mobile-first**
- GlassTable con nueva prop mobileCard: vista de cards en movil, tabla en desktop
- Cards responsive en Clientes (razon social, ID, tipo, email, estado, acciones)
- Cards responsive en Productos (nombre, codigo, precio, IVA, categoria, estado)
- Cards responsive en Compras (proveedor, ID, fecha, base IVA, monto IVA)
- Cards responsive en Empleados (nombre, ID, cargo, sueldo, estado)
- ComprobanteList con vistas separadas desktop (grid-cols-12) y mobile (cards compactas)
- ComprobanteDetalle con header responsive (flex-col en movil, flex-row en desktop)
- Formularios de comprobantes con grid-cols-1 md:grid-cols-2 (ya responsive)

**Mejoras touch y mobile UX**
- GlassButton: tamanos aumentados con min-height (36/44/48px), efecto active:scale-[0.97]
- GlassInput y GlassSelect: padding py-3 y text-base en movil para prevenir zoom en iOS
- GlassModal: comportamiento bottom-sheet en movil (animacion spring, drag handle, safe-area-bottom); centrado en desktop
- GlassTable: botones de paginacion con touch-target (44px minimo)
- BottomNav: barra mas alta (h-16), iconos de 20px, targets de 48px, efecto active:scale-95, safe-area-bottom
- Topbar: botones hamburguesa, notificaciones y perfil con touch-target (44px)
- Dropdown "Nuevo Comprobante" en comprobantes: bottom-sheet con AnimatePresence en movil, dropdown clasico en desktop
- Paginas CRUD (clientes, productos, compras, empleados): layout flex-col en movil, flex-row en desktop
- Utilidades CSS nuevas en globals.css: .touch-target (44px minimo), .safe-area-bottom (env safe-area-inset), .scrollbar-hide, prevencion de zoom iOS en inputs

### Fase 6 - Dashboard analitico, suscripciones, notificaciones y QA (Completada en codigo)

**Backend y datos**
- Migracion SQL: `supabase/migrations/20260323140000_dashboard_suscripciones_fase6.sql` — tablas `suscripciones`, `notificaciones`, `dashboard_cache`; funciones `contar_comprobantes_mes`, `verificar_limite_plan`, `calcular_metricas_dashboard` (SECURITY DEFINER, `search_path` fijo); RLS; seed de planes (starter, professional, enterprise) y suscripcion trial por empresa.
- `calcular_total_ventas_periodo()` no se sustituyo: el esquema ya fija `search_path` y devuelve TABLE consumida por ATS (cambiar la firma romperia el RPC).
- Proteccion de contrasenas filtradas (Supabase Auth): configurar en el panel del proyecto (no es codigo en repo).

**Dashboard (`/dashboard`)**
- Server Component + `DashboardAnalitico.jsx`: 4 KPIs con variacion % mes anterior; graficos Recharts (ventas 6 meses, tendencia area, pie por tipo de comprobante); top 5 clientes; medidor de uso del plan; bloque vencimiento con `infoVencimiento()` (noveno digito RUC); actividad reciente; enlace a Asistente IA.
- `src/lib/dashboard/metricas-service.js`: lectura de `dashboard_cache` (~5 min) y RPC `calcular_metricas_dashboard`.
- APIs: `GET /api/dashboard/metricas`, `GET /api/dashboard/prediccion` (Gemini `gemini-2.5-flash` via `ai` + `@ai-sdk/google`).

**Suscripciones**
- `src/lib/suscripciones/plan-limits.js`, `subscription-guard.js`, `usage-tracker.js`.
- `verificarPermisoEmision()` integrado en `src/lib/sri/comprobante-orchestrator.js` antes de firmar (error claro si limite o sin plan).
- Portal `/suscripcion`: plan actual, comparativa 3 planes, cambio de plan por Server Action (`src/actions/suscripcion-actions.js`, Zod), sin pasarela de pago.

**Notificaciones**
- `src/lib/notificaciones/notification-engine.js`: insercion de alertas (vencimiento, 80%/95% uso, certificado proximo a vencer) al listar; `NotificationBell`, `NotificationPanel`, `NotificationCard` en Topbar; `src/actions/notificacion-actions.js`.

**UI unificada**
- `StatusBadge.jsx`: estados SRI (incl. alias BOR, ENV, etc.), CRUD y suscripcion; sin `GlassBadge` en codigo fuente.
- Rutas pagina: `/compras/nuevo`, `/empleados/nuevo` (formularios completos, no modal principal).

**Tests (Vitest)**
- `src/__tests__/`: XML builders 6 tipos, clave 49 digitos / Modulo 11, periodos ATS (`getRangoPeriodo`), `PLAN_LIMITS`, catalogo SRI, `resolveEstadoKey` de StatusBadge.

**Validacion manual en navegador (marzo 2026)**
- Verificado: `/dashboard` muestra KPIs, secciones de graficos, vencimiento, actividad, estados en listado (Autorizado, Procesando, Anulado); sidebar y topbar con **Suscripcion** y **Notificaciones** (panel se abre).
- Entorno Supabase del desarrollador: si la migracion Fase 6 **no** esta aplicada, aparecen errores de PostgREST al usar `/suscripcion`, RPC de metricas o prediccion IA hasta ejecutar la migracion en el proyecto enlazado.

#### Checklist Fase 6 (alineado a `Plan_FactuIA/facturia-fase6-plan.md`)

| Bloque | Item | Estado |
|--------|------|--------|
| A UI | StatusBadge unificado (SRI + genericos + suscripcion) | Hecho |
| A | GlassBadge eliminado en `src` | Hecho (no existia archivo) |
| A | Imports GlassBadge | N/A (cero en codigo) |
| A | `/compras/nuevo`, `/empleados/nuevo` como pagina | Hecho |
| A | Dashboard / reportes / ventas monochrome | Hecho (revisado UI) |
| A | ComprobanteTimeline sin verde decorativo | Hecho (iconos `--text-secondary`) |
| A | Montos ventas | Hecho (`--text-primary` en resumen) |
| A | Chevron en configuracion | Hecho |
| A | Botones descarga reportes secondary | Hecho (reportes ATS, etc.) |
| A | Labels GlassSelect en CRUD | Parcial (componente soporta `label`; revisar pantallas sin label) |
| B | `calcular_total_ventas_periodo` search_path | Ya en esquema base (no duplicar NUMERIC del PDF) |
| B | Leaked password protection | Manual en Supabase Dashboard |
| B | Migracion Fase 6 aplicada en BD | **Pendiente en cada entorno** (archivo en repo listo) |
| B | 3 tablas + RLS + funciones + seed | Definido en SQL migracion |
| C | Widgets Recharts + KPIs + vencimientos + IA + API metricas | Hecho (IA falla sin RPC en BD) |
| D | Guard orquestador + portal + nav | Hecho (portal falla sin tabla `suscripciones`) |
| D | `verificarAccesoFeature` | Implementado en codigo (uso en features pendiente de cablear) |
| E | Campanita + panel + acciones | Hecho (listado depende de tabla `notificaciones`) |
| F | Tests Vitest + build | Hecho (`npm run test`, `npm run build`) |
| F | Comprobantes 03-07 autorizados en SRI pruebas | Pendiente (manual / Fase 7 seguimiento) |
| F | Deploy staging | No verificado en esta sesion |

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

### Base de datos (Supabase)

El esquema (tablas, RLS, vistas, funciones, bucket `certificados`) esta versionado en `supabase/migrations/`. Para un proyecto Supabase **nuevo**:

1. En el [SQL Editor](https://supabase.com/dashboard) de tu proyecto, ejecuta el archivo `supabase/migrations/20260323120000_facturia_schema.sql`, **o**
2. Con [Supabase CLI](https://supabase.com/docs/guides/cli): enlaza el proyecto (`supabase link --project-ref <ref>`) y aplica migraciones (`supabase db push`), usando la contrasena de base de datos del panel cuando la CLI la pida.

Luego configura las variables `NEXT_PUBLIC_SUPABASE_*` y `SUPABASE_SERVICE_ROLE_KEY` segun la seccion anterior.

### Ejecutar

```bash
npm run dev       # Servidor de desarrollo en http://localhost:3000
npm run build     # Build de produccion
npm run lint      # Verificar codigo
npm run test      # Tests unitarios (vitest)
```

---

## Guia de despliegue a AWS App Runner

Esta guia describe paso a paso como configurar el despliegue automatico a AWS App Runner usando GitHub Actions. Todo se hace desde las interfaces web (AWS Console y GitHub), sin necesidad de usar la linea de comandos.

### Paso 1: Crear repositorio ECR

1. Ir a [Amazon ECR Console](https://us-east-1.console.aws.amazon.com/ecr/home?region=us-east-1)
2. Click **Create repository**
3. Configurar:
   - Visibility: **Private**
   - Nombre: `facturia`
   - Region: `us-east-1`
4. Click **Create repository**

### Paso 2: Crear usuario IAM para GitHub Actions

1. Ir a [IAM Console](https://console.aws.amazon.com/iam/) > **Users** > **Create user**
2. Nombre: `github-actions-deploy`
3. En **Permissions**, click **Attach policies directly** y agregar:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AWSAppRunnerFullAccess`
4. Click **Create user**
5. Ir al usuario creado > **Security credentials** > **Create access key**
6. Seleccionar **Third-party service**, confirmar y **Create access key**
7. Guardar `Access key ID` y `Secret access key` de forma segura

### Paso 3: Configurar secretos en GitHub

1. Ir al repositorio en GitHub: `github.com/israelgo93/FacturIA`
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** para cada uno:

| Nombre del secreto en GitHub | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key ID del usuario IAM (Paso 2) |
| `AWS_SECRET_ACCESS_KEY` | Secret access key del usuario IAM (Paso 2) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL de produccion (ej: `https://xxxxx.us-east-1.awsapprunner.com`) |
| `RESEND_API_KEY` | API key de Resend |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Misma API key de Gemini |

**Nota**: Las variables `NEXT_PUBLIC_*` se necesitan en build-time porque Next.js las embebe en el bundle del cliente. Se pasan como `--build-arg` en el Dockerfile.

### Paso 4: Crear servicio App Runner

1. Ir a [App Runner Console](https://us-east-1.console.aws.amazon.com/apprunner/home?region=us-east-1)
2. Click **Create service**
3. Configurar fuente:
   - Source: **Container registry** > **Amazon ECR**
   - Repository: seleccionar `facturia`
   - Deployment trigger: **Automatic** (deploy al detectar nueva imagen)
4. Configurar servicio:
   - CPU: **1 vCPU**
   - Memory: **2 GB**
   - Port: **8080**
5. Click **Create & deploy**

### Paso 5: Configurar variables de entorno runtime

En App Runner Console, ir al servicio creado > **Configuration** > **Environment variables**:

| Variable | Valor |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key de Supabase |
| `ENCRYPTION_KEY` | Clave AES-256 de 32 caracteres |
| `SRI_AMBIENTE` | `1` (pruebas) o `2` (produccion) |
| `SRI_WS_RECEPCION_PRUEBAS` | URL WSDL recepcion pruebas |
| `SRI_WS_AUTORIZACION_PRUEBAS` | URL WSDL autorizacion pruebas |
| `SRI_WS_RECEPCION_PROD` | URL WSDL recepcion produccion |
| `SRI_WS_AUTORIZACION_PROD` | URL WSDL autorizacion produccion |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Misma API key de Gemini |
| `RESEND_API_KEY` | API key de Resend |

Los secretos sensibles se configuran directamente en la consola de App Runner como variables de entorno runtime (no se exponen en el repositorio ni en los workflows de CI/CD).

### Paso 6: Deploy automatico

El despliegue se activa automaticamente cuando se hace push a `main`:

1. GitHub Actions ejecuta `deploy-aws.yml`
2. Build de la imagen Docker con `NEXT_PUBLIC_*` como build-args
3. Push de la imagen a Amazon ECR (us-east-1)
4. App Runner detecta la nueva imagen y despliega automaticamente

Para verificar:
1. En GitHub: ir a **Actions** y ver el workflow ejecutandose
2. Una vez completado, en AWS App Runner Console: verificar que el servicio muestra **Running**
3. Acceder a la URL del servicio (formato: `https://xxxxx.us-east-1.awsapprunner.com`)

### Paso 7: Configurar dominio personalizado (opcional)

1. En App Runner Console, click en el servicio desplegado
2. Ir a la pestana **Custom domains**
3. Click **Link domain**
4. Ingresar el dominio y seguir las instrucciones para configurar los registros DNS (CNAME)

### Verificacion post-despliegue

Despues del primer despliegue exitoso, verificar:

- [ ] La aplicacion carga correctamente en la URL de App Runner
- [ ] Login y registro funcionan (Supabase Auth)
- [ ] Las variables de entorno runtime se inyectan correctamente (verificar en App Runner > Configuration)
- [ ] El certificado .p12 se puede subir y usar para firmar

### Resumen de la infraestructura

```
GitHub (repositorio)
    |
    +-- Push a main --> GitHub Actions (deploy-aws.yml)
    |                       |
    |                       +-- Build Docker image con NEXT_PUBLIC_* como build-args
    |                       +-- Push imagen a Amazon ECR (us-east-1)
    |                       +-- App Runner auto-deploy al detectar nueva imagen
    |
    +-- Pull Request --> GitHub Actions (ci.yml)
                            +-- npm ci + lint + build + test
```

### Notas importantes

- El Dockerfile usa `output: 'standalone'` de Next.js para crear una imagen optimizada (~150MB)
- Las variables `NEXT_PUBLIC_*` deben pasarse como `--build-arg` durante el build de Docker
- Los secretos sensibles se gestionan como variables de entorno en App Runner Console (no en el repositorio)
- No se usa archivo `apprunner.yaml` — la configuracion se gestiona directamente desde la consola de AWS
- App Runner escala automaticamente segun la demanda (sin necesidad de configurar min/max instances manualmente)

---

## Estructura del proyecto

```
facturia/
+-- .cursor/                  Configuracion de agentes IA
|   +-- rules/                Reglas del proyecto (3)
|   +-- agents/               SubAgentes especializados (4)
|   +-- skills/               Conocimiento reutilizable (5)
|   +-- commands/             Workflows invocables (3)
+-- .github/workflows/        CI/CD (2 pipelines)
+-- public/                   Assets estaticos
|   +-- manifest.json         PWA manifest
|   +-- icons/                Iconos PWA (192, 512, maskable, apple-touch)
+-- src/
|   +-- app/                  Rutas (App Router)
|   |   +-- sw.js             Service worker source (Serwist)
|   |   +-- serwist-provider.js  Client-side SerwistProvider
|   |   +-- serwist/[path]/   Route handler generacion SW
|   |   +-- ~offline/         Pagina fallback sin conexion
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
+-- Dockerfile                Multi-stage build para App Runner (node:20-alpine, puerto 8080)
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
| ci-cd-apprunner | CI/CD GitHub Actions hacia App Runner |

---

## CI/CD

| Pipeline | Trigger | Destino |
|----------|---------|---------|
| ci.yml | Pull Request | Lint + Build (validacion) |
| deploy-aws.yml | Push a main | ECR + App Runner produccion |

---

## Roadmap

| Fase | Descripcion | Estado |
|------|------------|--------|
| **Fase 1** | Fundacion: proyecto, UI, auth, BD, CI/CD | Completada |
| **Fase 2** | Temas, onboarding, config empresa, catalogos clientes/productos | Completada |
| **Fase 3** | Motor de facturacion electronica (firma, SRI, RIDE, email) | Completada |
| **Fase 4** | Comprobantes adicionales (NC, ND, Ret, GR, LC) + XML builders + RIDE | Completada |
| **Fase 5** | Reportes IA + ATS/RDEP + compras + empleados + chat tributario | Completada |
| **Fase 5.1** | PWA completa: service worker, cache offline, iconos, manifest, meta tags | Completada |
| Fase 6 | Dashboard analitico + suscripciones | Pendiente |
| Fase 7 | Produccion, testing y calidad | Pendiente |

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.
