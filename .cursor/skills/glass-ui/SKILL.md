---
description: "Sistema de diseño Ethereal Glass monocromático para facturIA. Usar cuando se creen componentes UI, páginas, o layouts con el estilo visual etéreo en blanco y negro de la plataforma."
---

# Skill: Sistema Ethereal Glass UI facturIA

## Cuándo Usar
- Crear nuevos componentes de interfaz
- Estilizar páginas o secciones
- Implementar variantes de componentes existentes

## Filosofía
Ethereal Glass es un estilo visual que combina el efecto glassmorphism con
una paleta EXCLUSIVAMENTE monocromática (blanco y negro). El resultado es
una interfaz etérea, minimalista y elegante donde la jerarquía visual se
logra únicamente mediante niveles de brillo (opacidad del blanco).

## Tokens de Diseño
```css
/* Background */
background: #09090b; /* negro sólido, sin gradientes */

/* Glass base */
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 20px;
box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);

/* Glass hover */
background: rgba(255, 255, 255, 0.06);
border-color: rgba(255, 255, 255, 0.10);

/* Botón primario */
background: white;
color: black;

/* Texto — jerarquía por opacidad */
color: rgba(255, 255, 255, 0.90);  /* primario */
color: rgba(255, 255, 255, 0.55);  /* secundario */
color: rgba(255, 255, 255, 0.30);  /* muted */
color: rgba(255, 255, 255, 0.15);  /* ghost */
```

## Componentes Disponibles
Usar los componentes de `src/components/ui/`:
- GlassCard, GlassButton, GlassInput, GlassSelect
- GlassModal, GlassTable, GlassAlert, GlassBadge

## Principios
1. SOLO blanco y negro — nunca usar colores
2. Mobile-first: diseñar desde 320px
3. Jerarquía por brillo: más importante = más brillante
4. Animaciones etéreas: lentas (300-500ms), easing suave
5. Spacing generoso: mucho espacio negativo
6. Labels: uppercase, tracking-wider, text-xs
7. Iconos: lucide-react, 18px, opacidad baja
8. Sombras: largas y difusas para efecto flotante
9. Bordes: muy sutiles, casi invisibles
10. Tipografía: Inter, pesos ligeros (400-500)
