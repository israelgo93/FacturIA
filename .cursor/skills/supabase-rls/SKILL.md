---
description: "Patrones de Row Level Security para Supabase en arquitectura multi-tenant. Usar cuando se creen nuevas tablas, políticas RLS, o queries que involucren aislamiento de datos por empresa."
---

# Skill: Supabase RLS Multi-Tenant

## Cuándo Usar
- Crear una nueva tabla en el schema
- Definir políticas de acceso a datos
- Debuggear problemas de acceso entre empresas
- Optimizar queries con RLS

## Patrón Base
Toda tabla con datos de empresa debe seguir este patrón:

```sql
-- 1. Crear tabla con empresa_id
CREATE TABLE nueva_tabla (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- ... otros campos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

-- 3. Política de aislamiento
CREATE POLICY "empresa_isolation" ON nueva_tabla
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- 4. Índice por empresa_id (performance)
CREATE INDEX idx_nueva_tabla_empresa ON nueva_tabla(empresa_id);
```

## Excepciones
- `planes`: lectura pública (sin RLS de empresa)
- `auth.users`: gestionado por Supabase Auth

## Anti-Patrones
- NUNCA usar service_role para bypass de RLS en el frontend
- NUNCA filtrar por empresa_id solo en el código (debe ser en RLS)
- NUNCA crear tablas sin RLS
