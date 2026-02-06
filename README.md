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
| Certificados | node-forge | 1.3 |
| Cifrado | crypto-js (AES-256) | 4 |
| IA | Google Gemini API | 2.0 Flash |
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
    |           +-- /comprobantes      Comprobantes electronicos
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

15 tablas con RLS habilitado, 17 indices y funciones de negocio:

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
| comprobantes | Comprobantes electronicos emitidos |
| comprobante_detalles | Items de cada comprobante |
| retencion_detalles | Detalle de retenciones |
| reportes_sri | ATS, RDEP y formularios generados |
| sri_log | Auditoria de comunicacion con el SRI |
| config_email | Configuracion de envio de correos |
| ia_conversaciones | Historial de chat con la IA |

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=facturIA
ENCRYPTION_KEY=tu-clave-aes-256-de-32-caracteres
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
|   +-- lib/
|   |   +-- supabase/         Clientes browser y servidor
|   |   +-- validations/      Schemas Zod (auth, empresa, cliente, producto)
|   |   +-- utils/            Constantes, formatters, catalogos SRI
|   |   +-- crypto/           Cifrado AES-256
|   |   +-- sri/              Parser de certificados .p12
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
| Fase 3 | Motor de facturacion electronica | Pendiente |
| Fase 4 | Comprobantes adicionales (NC, ND, retenciones) | Pendiente |
| Fase 5 | Reportes IA + ATS/RDEP | Pendiente |
| Fase 6 | Dashboard analitico + suscripciones | Pendiente |
| Fase 7 | Produccion, testing y calidad | Pendiente |

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.
