# facturIA - Checklist Fase 2: Onboarding + Catalogos + Temas

## Estado: COMPLETADA
**Fecha:** 6 de febrero de 2026
**Stack:** Next.js 16.1.6 | React 19.2.4 | JavaScript (ES2024) | Supabase | Tailwind CSS 4 | Zod 4.3.6
**Temas:** next-themes (claro/oscuro/sistema)

---

## A. Sistema de Temas (Light / Dark / System)
- [x] `next-themes` instalado y configurado
- [x] `src/styles/globals.css` — Tokens CSS completos para ambos temas (dark `:root`, light `[data-theme="light"]`)
- [x] `src/components/providers/ThemeProvider.jsx` — Provider con `data-theme` attribute
- [x] `src/components/ui/ThemeToggle.jsx` — Boton rotativo Sun/Moon/Monitor
- [x] `src/app/layout.js` — ThemeProvider envuelve la app, suppressHydrationWarning
- [x] 8 componentes Glass UI actualizados con CSS variables
- [x] 4 componentes Layout actualizados con CSS variables (Sidebar, Topbar, BottomNav, MobileMenu)
- [x] `src/app/page.js` — Server Component con deteccion de auth + landing adaptada a temas
- [x] `src/components/pages/LandingPage.jsx` — Landing extraida como Client Component con ThemeToggle
- [x] `src/app/(dashboard)/page.js` — Dashboard adaptado a ambos temas
- [x] `public/manifest.json` — Colores corregidos
- [x] ThemeToggle integrado en: Topbar del dashboard, landing page, login, registro, recuperar

## B. Migracion Base de Datos
- [x] Migracion `add_onboarding_fields_to_empresas` aplicada via MCP Supabase
- [x] Campo `onboarding_completado BOOLEAN DEFAULT false` en tabla empresas
- [x] Campo `onboarding_paso INTEGER DEFAULT 0` en tabla empresas

## C. Correccion de Agentes Cursor
- [x] `.cursor/agents/repo-scout.md` — NUEVO con frontmatter YAML correcto
- [x] `.cursor/agents/sri-validator.md` — NUEVO con frontmatter YAML correcto
- [x] `.cursor/agents/test-writer.md` — NUEVO con frontmatter YAML correcto
- [x] `.cursor/agents/db-migrator.md` — NUEVO con frontmatter YAML correcto
- [x] Eliminados: planner.md, backend-dev.md, frontend-dev.md, devops-engineer.md, db-architect.md, qa-tester.md, sri-specialist.md
- [x] `.cursor/rules/agents.mdc` — Actualizado con 4 subagentes + 5 skills
- [x] `.cursor/rules/project.mdc` — Actualizado: Next.js 16+, Zod 4, next-themes, sistema de temas
- [x] `.cursor/skills/glass-ui/SKILL.md` — Actualizado con documentacion de temas

## D. Configuracion Empresa (CRUD)
- [x] `src/lib/validations/empresa.js` — Schemas Zod: empresa, establecimiento, punto emision
- [x] `src/app/(dashboard)/configuracion/page.js` — Hub con 4 secciones (Empresa, Establecimientos, Puntos Emision, Certificado)
- [x] `src/app/(dashboard)/configuracion/empresa/page.js` — Formulario crear/editar empresa
- [x] `src/app/(dashboard)/configuracion/empresa/actions.js` — Server Actions: obtener, crear, actualizar
- [x] `src/app/(dashboard)/configuracion/establecimientos/page.js` — Lista + modal crear/editar
- [x] `src/app/(dashboard)/configuracion/establecimientos/actions.js` — CRUD + toggle activo/inactivo
- [x] `src/app/(dashboard)/configuracion/puntos-emision/page.js` — Lista + modal crear/editar
- [x] `src/app/(dashboard)/configuracion/puntos-emision/actions.js` — CRUD + toggle activo/inactivo
- [x] Validacion RUC con Modulo 11 integrada

## E. Certificado Digital .p12
- [x] `node-forge` instalado para parsing PKCS#12
- [x] `src/lib/crypto/aes.js` — Cifrado/descifrado AES-256 con crypto-js
- [x] `src/lib/sri/certificate-parser.js` — Parser .p12 (propietario, emisor, serial, fechas)
- [x] `src/app/(dashboard)/configuracion/certificado/page.js` — UI upload + estado + alerta vencimiento
- [x] `src/app/(dashboard)/configuracion/certificado/actions.js` — Server Actions: obtener, subir, eliminar
- [x] Validacion: extension .p12/.pfx, tamano max 5MB, contrasena, vencimiento
- [x] Cifrado de contrasena con AES-256 antes de guardar en BD
- [x] Subida a Supabase Storage bucket `certificados/{empresa_id}/`
- [x] Desactivacion automatica de certificado anterior al subir uno nuevo

## F. Onboarding Wizard (Multi-Paso)
- [x] `src/app/(dashboard)/onboarding/page.js` — Wizard completo de 5 pasos
- [x] `src/app/(dashboard)/onboarding/actions.js` — Server Actions para cada paso + completar
- [x] `src/app/(dashboard)/onboarding/components/OnboardingProgress.jsx` — Barra de progreso visual
- [x] Paso 0: Datos de empresa (RUC, razon social, regimen fiscal, etc.)
- [x] Paso 1: Establecimiento principal (codigo 001)
- [x] Paso 2: Punto de emision principal (codigo 001)
- [x] Paso 3: Certificado digital (opcional, puede omitir)
- [x] Paso 4: Resumen y confirmacion
- [x] Marca `onboarding_completado = true` al completar
- [x] Navegacion entre pasos (anterior/siguiente)
- [x] Estructura preparada para integracion futura con Gemini IA

## G. CRUD Clientes
- [x] `src/lib/validations/cliente.js` — Schema Zod con validacion RUC/Cedula integrada
- [x] `src/app/(dashboard)/clientes/page.js` — Tabla paginada + busqueda + filtros
- [x] `src/app/(dashboard)/clientes/actions.js` — Server Actions: listar, crear, actualizar, obtener, toggle, importar CSV
- [x] `src/app/(dashboard)/clientes/nuevo/page.js` — Formulario crear cliente
- [x] `src/app/(dashboard)/clientes/[id]/page.js` — Formulario editar cliente
- [x] `src/app/(dashboard)/clientes/importar/page.js` — Importador CSV con reporte errores
- [x] Filtros: tipo identificacion, activo/inactivo
- [x] Busqueda por razon social e identificacion
- [x] Validacion en tiempo real RUC (Modulo 11) y Cedula (Modulo 10)
- [x] Importacion CSV masiva con upsert (no duplica registros)

## H. CRUD Productos
- [x] `src/lib/validations/producto.js` — Schema Zod con tarifas IVA validas
- [x] `src/app/(dashboard)/productos/page.js` — Tabla paginada + busqueda + filtros
- [x] `src/app/(dashboard)/productos/actions.js` — Server Actions: listar, crear, actualizar, obtener, toggle, importar CSV
- [x] `src/app/(dashboard)/productos/nuevo/page.js` — Formulario con config IVA/ICE
- [x] `src/app/(dashboard)/productos/[id]/page.js` — Formulario editar
- [x] `src/app/(dashboard)/productos/importar/page.js` — Importador CSV
- [x] Selector de tarifa IVA (0%, 5%, 12%, 13%, 14%, 15%, No Objeto, Exento)
- [x] Configuracion ICE opcional
- [x] Busqueda por nombre y codigo

## I. Flujo de Autenticacion y Redireccion
- [x] `src/app/page.js` — Server Component: detecta auth, redirige a onboarding o comprobantes
- [x] `src/components/pages/LandingPage.jsx` — Landing extraida como Client Component independiente
- [x] `src/middleware.js` — Proteccion de rutas y redireccion de usuarios autenticados
- [x] Flujo: login -> `/` -> detecta auth -> redirige a `/onboarding` o `/comprobantes`
- [x] Paginas de auth (login, registro, recuperar) actualizadas con CSS variables y ThemeToggle
- [x] `src/components/shared/Logo.jsx` — Actualizado para soportar ambos temas

## J. Verificacion Final
- [x] `npm run build` exitoso (21 rutas, 0 errores)
- [x] Todas las rutas generadas correctamente
- [x] Tema claro verificado visualmente en navegador
- [x] Tema oscuro verificado visualmente en navegador
- [x] Toggle de tema funcional (rotacion claro/oscuro/sistema)
- [x] Redireccion post-login funcional (no queda en landing)
- [x] Onboarding accesible despues del login

---

## Resumen Numerico
| Categoria | Cantidad |
|-----------|----------|
| Dependencias nuevas | 2 (next-themes, node-forge) |
| Migraciones BD | 1 (onboarding fields) |
| SubAgentes Cursor (nuevos) | 4 |
| SubAgentes eliminados | 7 |
| Rules actualizadas | 2 |
| Skills actualizados | 1 |
| Componentes UI nuevos | 3 (ThemeToggle, OnboardingProgress, LandingPage) |
| Componentes UI actualizados | 13 (8 Glass + 4 Layout + Logo) |
| Paginas nuevas/modificadas | 16 |
| Server Actions nuevos | 7 archivos (~25 funciones) |
| Validaciones Zod nuevas | 3 (empresa, cliente, producto) |
| Librerias creadas | 2 (crypto/aes, sri/certificate-parser) |
| Provider creado | 1 (ThemeProvider) |
| **Total archivos creados/modificados** | **~50** |

## Rutas de la Aplicacion (21 total)
```
/                                -> Landing publica o redireccion a dashboard
/login                           -> Inicio de sesion
/registro                        -> Registro
/recuperar                       -> Recuperar contrasena
/auth/callback                   -> Callback confirmacion email
/clientes                        -> Lista clientes (tabla paginada)
/clientes/nuevo                  -> Crear cliente
/clientes/[id]                   -> Editar cliente
/clientes/importar               -> Importar CSV
/comprobantes                    -> Listado comprobantes (placeholder)
/configuracion                   -> Hub de configuracion
/configuracion/empresa           -> Datos empresa
/configuracion/establecimientos  -> CRUD establecimientos
/configuracion/puntos-emision    -> CRUD puntos emision
/configuracion/certificado       -> Upload .p12
/onboarding                      -> Wizard 5 pasos
/productos                       -> Lista productos (tabla paginada)
/productos/nuevo                 -> Crear producto
/productos/[id]                  -> Editar producto
/productos/importar              -> Importar CSV
/reportes                        -> Hub reportes SRI (placeholder)
```
