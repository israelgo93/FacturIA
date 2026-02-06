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
| Base de datos | PostgreSQL (Supabase) | 15 |
| Autenticacion | Supabase Auth | - |
| Almacenamiento | Supabase Storage | - |
| Estado global | Zustand | 5 |
| Validacion | Zod + React Hook Form | 4 / 7 |
| Animaciones | Framer Motion | 12 |
| IA | Google Gemini API | 2.0 Flash |
| Despliegue | Google Cloud Run | - |
| CI/CD | GitHub Actions | - |

---

## Sistema de diseno

**Ethereal Glass Monocromatico** — un estilo visual etereo y minimalista que usa exclusivamente blanco y negro.

```
Fondo:      #09090b (negro solido)
Glass:      rgba(255, 255, 255, 0.03–0.08) + backdrop-blur
Bordes:     rgba(255, 255, 255, 0.05–0.10)
Texto:      white con opacidades 0.90 / 0.55 / 0.30 / 0.15
Boton CTA:  fondo blanco, texto negro
Estados:    diferenciados por brillo, no por color
```

La jerarquia visual se logra mediante niveles de opacidad del blanco. No se usan colores.

### Componentes UI

| Componente | Proposito |
|-----------|-----------|
| GlassCard | Contenedor con variantes y animacion |
| GlassButton | Primario (blanco/negro), secundario, ghost |
| GlassInput | Input con label uppercase e icono |
| GlassSelect | Select con chevron |
| GlassModal | Modal con backdrop blur |
| GlassTable | Tabla con paginacion y loading |
| GlassAlert | Alertas diferenciadas por opacidad |
| GlassBadge | Estados SRI por nivel de brillo |

---

## Arquitectura

```
facturia.app (Google Cloud Run)
    |
    +-- Next.js 16 (App Router, SSR, Server Actions)
    |       |
    |       +-- /              Landing publica
    |       +-- /login         Autenticacion
    |       +-- /registro      Registro
    |       +-- /recuperar     Recuperar contrasena
    |       +-- /(dashboard)   Rutas protegidas
    |           +-- /              Dashboard KPIs
    |           +-- /comprobantes  Comprobantes electronicos
    |           +-- /clientes      Gestion de clientes
    |           +-- /productos     Catalogo productos
    |           +-- /reportes      Reportes SRI con IA
    |           +-- /configuracion Empresa y ajustes
    |           +-- /onboarding    Configuracion guiada por IA
    |
    +-- Supabase
    |       +-- PostgreSQL 15 (15 tablas, RLS multi-tenant)
    |       +-- Auth (email/password, refresh tokens)
    |       +-- Storage (certificados .p12)
    |
    +-- Google Gemini API (IA tributaria)
    |
    +-- SRI Ecuador (Web Services SOAP)
```

### Multi-tenant

Cada empresa opera en un espacio aislado mediante Row Level Security (RLS). Todas las tablas filtran por `empresa_id` a nivel de base de datos, imposibilitando el acceso cruzado entre empresas.

---

## Base de datos

15 tablas con RLS habilitado, 17 indices y funciones de negocio:

| Tabla | Proposito |
|-------|-----------|
| planes | Planes SaaS (starter, professional, enterprise) |
| empresas | Datos del contribuyente y suscripcion |
| establecimientos | Establecimientos del contribuyente |
| puntos_emision | Puntos de emision por establecimiento |
| secuenciales | Secuenciales por tipo de comprobante |
| certificados | Metadata de certificados .p12 |
| clientes | Clientes/receptores |
| productos | Catalogo con configuracion IVA/ICE |
| comprobantes | Comprobantes electronicos emitidos |
| comprobante_detalles | Items de cada comprobante |
| retencion_detalles | Detalle de retenciones |
| reportes_sri | ATS, RDEP y formularios generados |
| sri_log | Auditoria de comunicacion con el SRI |
| config_email | Configuracion de envio de correos |
| ia_conversaciones | Historial de chat con la IA |

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

- Node.js 18.18+ (desarrollo local usa v25, Docker usa v20 LTS)
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
|   +-- agents/               Agentes especializados (7)
|   +-- skills/               Conocimiento reutilizable (5)
|   +-- commands/             Workflows invocables (3)
+-- .github/workflows/        CI/CD (3 pipelines)
+-- public/                   Assets estaticos
+-- src/
|   +-- app/                  Rutas (App Router)
|   |   +-- (auth)/           Login, registro, recuperar
|   |   +-- (dashboard)/      Rutas protegidas
|   |   +-- auth/callback/    Callback de confirmacion
|   +-- components/
|   |   +-- ui/               8 componentes Glass
|   |   +-- layout/           Sidebar, Topbar, BottomNav, MobileMenu
|   |   +-- shared/           Logo, LoadingSpinner, EmptyState
|   +-- lib/
|   |   +-- supabase/         Clientes browser y servidor
|   |   +-- validations/      Schemas Zod
|   |   +-- utils/            Constantes, formatters, catalogos SRI
|   +-- stores/               Zustand (auth, empresa, UI)
|   +-- styles/               Tokens Ethereal Glass
+-- Dockerfile                Multi-stage build para Cloud Run
+-- Plan_FactuIA/             Documentacion de planificacion
```

---

## Agentes IA (Cursor)

El proyecto incluye un equipo de 7 agentes especializados para desarrollo asistido:

| Agente | Rol |
|--------|-----|
| planner | Planificacion y diseno de features |
| backend-dev | Server Actions, API routes, Supabase |
| frontend-dev | React, Tailwind, Ethereal Glass UI |
| sri-specialist | XML SRI, firma XAdES-BES, SOAP |
| db-architect | PostgreSQL, migraciones, RLS |
| qa-tester | Tests unitarios, integracion, E2E |
| devops-engineer | Docker, CI/CD, Cloud Run |

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
| Fase 2 | Onboarding IA + CRUD catalogos | Pendiente |
| Fase 3 | Motor de facturacion electronica | Pendiente |
| Fase 4 | Comprobantes adicionales (NC, ND, retenciones) | Pendiente |
| Fase 5 | Reportes IA + ATS/RDEP | Pendiente |
| Fase 6 | Dashboard analitico + suscripciones | Pendiente |
| Fase 7 | Produccion, testing y calidad | Pendiente |

---

## Licencia

Este proyecto es privado. Todos los derechos reservados.
