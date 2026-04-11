-- ============================================================
-- AgendaPro — Supabase Advanced Migrations
-- Políticas de Segurança (RLS) e Auditoria
-- Execute este SQL no Supabase SQL Editor após migrations.sql
-- ============================================================

-- ============================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security)
-- ============================================================

-- 1. USERS — Cada usuário só vê seus próprios dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- 2. BUSINESSES — Apenas o dono pode ver/editar
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses visible to owner and admins"
  ON businesses FOR SELECT
  USING (owner_id::text = auth.uid()::text OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin'));

CREATE POLICY "Only owner can update business"
  ON businesses FOR UPDATE
  USING (owner_id::text = auth.uid()::text)
  WITH CHECK (owner_id::text = auth.uid()::text);

CREATE POLICY "Only owner can delete business"
  ON businesses FOR DELETE
  USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Authenticated users can create business"
  ON businesses FOR INSERT
  WITH CHECK (owner_id::text = auth.uid()::text);

-- 3. SERVICES — Visíveis para o negócio e públicos
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services visible to business owner"
  ON services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    ) OR active = true
  );

CREATE POLICY "Only business owner can create service"
  ON services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Only business owner can update service"
  ON services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = services.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  );

-- 4. PROFESSIONALS — Visíveis para o negócio
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals visible to business owner"
  ON professionals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = professionals.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    ) OR active = true
  );

CREATE POLICY "Only business owner can manage professionals"
  ON professionals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = professionals.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  );

-- 5. APPOINTMENTS — Clientes veem seus próprios, donos veem do negócio
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (
    client_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = appointments.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owner can update appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = appointments.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = appointments.business_id 
      AND businesses.owner_id::text = auth.uid()::text
    )
  );

-- 6. SUBSCRIPTIONS — Cada usuário vê apenas suas próprias
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id::text = auth.uid()::text OR role = 'admin');

-- ============================================================
-- TABELA DE AUDITORIA (Opcional mas recomendado)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- FUNÇÃO DE AUDITORIA
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, user_id, old_values, new_values)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria nas tabelas críticas
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_businesses AFTER INSERT OR UPDATE OR DELETE ON businesses FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON subscriptions FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ============================================================
-- FUNÇÃO DE VALIDAÇÃO DE EMAIL
-- ============================================================
CREATE OR REPLACE FUNCTION validate_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_email BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION validate_email();

-- ============================================================
-- FUNÇÃO DE SOFT DELETE
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Política para não mostrar registros deletados
CREATE POLICY "Hide deleted users"
  ON users FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================================
-- FUNÇÃO PARA CALCULAR RECEITA
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_revenue(business_id UUID, start_date DATE, end_date DATE)
RETURNS NUMERIC AS $$
SELECT COALESCE(SUM(price), 0)
FROM appointments
WHERE appointments.business_id = $1
  AND DATE(appointments.created_at) BETWEEN $2 AND $3
  AND appointments.status IN ('completed', 'confirmed')
  AND appointments.deleted_at IS NULL;
$$ LANGUAGE SQL;

-- ============================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_businesses_deleted ON businesses(deleted_at);
