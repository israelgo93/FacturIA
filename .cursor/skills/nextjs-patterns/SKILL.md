---
description: "Patrones de desarrollo Next.js 16 con App Router para facturIA. Usar cuando se implementen rutas, Server Actions, layouts, o loading states."
---

# Skill: Patrones Next.js 16 facturIA

## Cuándo Usar
- Crear nuevas páginas o layouts
- Implementar Server Actions
- Manejar loading/error states
- Configurar metadata y SEO

## Patrones

### Server Action con validación
```javascript
'use server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ /* ... */ });

export async function action(prevState, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    const { data, error } = await supabase
      .from('tabla')
      .insert({ ...parsed.data, empresa_id: empresa.id })
      .select().single();
    if (error) throw error;
    revalidatePath('/ruta');
    return { success: true, data };
  } catch (err) {
    return { error: err.message };
  }
}
```

### Loading State
```javascript
// app/(dashboard)/ruta/loading.js
export default function Loading() {
  return <GlassCard className="animate-pulse">Cargando...</GlassCard>;
}
```

### Error Boundary
```javascript
// app/(dashboard)/ruta/error.js
'use client';
export default function Error({ error, reset }) {
  return (
    <GlassCard>
      <p>Error: {error.message}</p>
      <GlassButton onClick={reset}>Reintentar</GlassButton>
    </GlassCard>
  );
}
```
