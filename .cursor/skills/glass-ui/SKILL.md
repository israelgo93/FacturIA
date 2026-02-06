---
description: "Sistema de diseño Ethereal Glass con soporte de temas (claro/oscuro/sistema) para facturIA. Usar cuando se creen componentes UI, páginas, o layouts con el estilo visual de la plataforma."
---

# Skill: Sistema Glass UI facturIA — Con Temas

## Cuándo Usar
- Crear nuevos componentes de interfaz
- Estilizar páginas o secciones
- Implementar variantes de componentes existentes
- Adaptar componentes a ambos temas

## Sistema de Temas
El proyecto usa `next-themes` con `data-theme` attribute.
Variables CSS definidas en `src/styles/globals.css`:

### Variables principales
```css
var(--bg-primary)       /* Fondo principal */
var(--bg-secondary)     /* Fondo secundario */
var(--glass-bg)         /* Fondo glass */
var(--glass-hover)      /* Glass hover */
var(--glass-border)     /* Borde glass */
var(--text-primary)     /* Texto principal */
var(--text-secondary)   /* Texto secundario */
var(--text-muted)       /* Texto sutil */
var(--btn-primary-bg)   /* Botón primario fondo */
var(--btn-primary-text) /* Botón primario texto */
var(--input-bg)         /* Input fondo */
var(--input-border)     /* Input borde */
var(--divider)          /* Separador */
```

### Cómo aplicar estilos
Usar `style={{ ... }}` con variables CSS para colores que cambian con el tema:
```jsx
<div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
```

Para clases Tailwind que NO dependen del tema (spacing, layout), usar directamente:
```jsx
<div className="p-6 rounded-2xl flex items-center gap-3">
```

## Componentes Disponibles
Usar los componentes de `src/components/ui/`:
- GlassCard, GlassButton, GlassInput, GlassSelect
- GlassModal, GlassTable, GlassAlert, GlassBadge
- ThemeToggle (selector de tema)

## Principios
1. Mobile-first: diseñar desde 320px
2. Todos los colores via CSS variables (NUNCA hardcodear)
3. Animaciones sutiles: transiciones de 200-300ms
4. Spacing consistente: múltiplos de 4px (4, 8, 12, 16, 24, 32)
5. Iconos: lucide-react exclusivamente, tamaño 16-24px
