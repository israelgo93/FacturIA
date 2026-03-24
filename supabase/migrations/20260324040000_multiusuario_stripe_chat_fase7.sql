-- =============================================
-- MIGRACION 013: Multi-Usuario + Stripe + Chat IA
-- Fase 7 — facturIA SaaS
-- =============================================

-- 1. Tabla perfiles_empresa (relacion N:N usuarios <-> empresas)
CREATE TABLE IF NOT EXISTS perfiles_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'emisor' CHECK (rol IN ('propietario', 'admin', 'contador', 'emisor', 'visor')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

ALTER TABLE perfiles_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfiles_empresa_own" ON perfiles_empresa
  USING (user_id = auth.uid() OR empresa_id IN (
    SELECT pe.empresa_id FROM perfiles_empresa pe WHERE pe.user_id = auth.uid()
  ));

-- 2. Tabla invitaciones
CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'contador', 'emisor', 'visor')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'expirada', 'revocada')),
  invitado_por UUID REFERENCES auth.users(id),
  aceptado_por UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitaciones_tenant" ON invitaciones
  USING (empresa_id IN (
    SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
  ));

-- 3. Tabla chat_sesiones
CREATE TABLE IF NOT EXISTS chat_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  titulo TEXT,
  periodo_contexto TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sesiones_tenant" ON chat_sesiones
  USING (empresa_id IN (
    SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
  ));

-- 4. Tabla chat_mensajes
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES chat_sesiones(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_mensajes_tenant" ON chat_mensajes
  USING (sesion_id IN (
    SELECT id FROM chat_sesiones WHERE empresa_id IN (
      SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
    )
  ));

-- 5. Campos Stripe en suscripciones
ALTER TABLE suscripciones
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 6. Campos Stripe en planes
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- 7. Indices
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa_user ON perfiles_empresa(user_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa_empresa ON perfiles_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa ON invitaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email ON invitaciones(email);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON invitaciones(token);
CREATE INDEX IF NOT EXISTS idx_chat_sesiones_empresa ON chat_sesiones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_chat_sesiones_user ON chat_sesiones(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_sesion ON chat_mensajes(sesion_id);

-- 8. Triggers updated_at
CREATE TRIGGER set_updated_at_perfiles_empresa BEFORE UPDATE ON perfiles_empresa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_invitaciones BEFORE UPDATE ON invitaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_chat_sesiones BEFORE UPDATE ON chat_sesiones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. Migrar usuarios existentes a perfiles_empresa como propietarios
INSERT INTO perfiles_empresa (user_id, empresa_id, rol)
SELECT user_id, id, 'propietario'
FROM empresas
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;
