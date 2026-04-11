-- ============================================
-- AgendaPro - Script de Criação de Tabelas
-- Execute no SQL Editor do Supabase
-- ============================================

-- ============================================
-- TABELA USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client', 'professional')),
  avatar TEXT,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  plan_name TEXT,
  plan_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA BUSINESSES
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo TEXT,
  theme_color TEXT DEFAULT '#7C3AED',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  working_hours TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#7C3AED',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA PROFESSIONALS
-- ============================================
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  specialty TEXT,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  service_name TEXT,
  professional_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  plan_name TEXT,
  price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'inactive')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA AVAILABILITY
-- ============================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_business ON professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_professional ON availability(professional_id);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- USERS: Usuários podem ver/editar próprio perfil
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- BUSINESSES: Donos e admins podem ver/editar
CREATE POLICY "businesses_select" ON businesses FOR SELECT USING (owner_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "businesses_insert" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "businesses_update" ON businesses FOR UPDATE USING (owner_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- SERVICES: Donos do negócio podem editar
CREATE POLICY "services_select" ON services FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "services_update" ON services FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "services_delete" ON services FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- PROFESSIONALS: Donos do negócio podem editar
CREATE POLICY "professionals_select" ON professionals FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "professionals_insert" ON professionals FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "professionals_update" ON professionals FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "professionals_delete" ON professionals FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- APPOINTMENTS: Donos do negócio e clientes podem ver
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR client_id = auth.uid()
);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- SUBSCRIPTIONS: Apenas o próprio usuário
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (user_id = auth.uid());

-- AVAILABILITY: Donos do negócio podem editar
CREATE POLICY "availability_select" ON availability FOR SELECT USING (
  professional_id IN (SELECT id FROM professionals WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);
CREATE POLICY "availability_insert" ON availability FOR INSERT WITH CHECK (
  professional_id IN (SELECT id FROM professionals WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);
CREATE POLICY "availability_update" ON availability FOR UPDATE USING (
  professional_id IN (SELECT id FROM professionals WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);
CREATE POLICY "availability_delete" ON availability FOR DELETE USING (
  professional_id IN (SELECT id FROM professionals WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
);

-- ============================================
-- TABELA PÚBLICA PARA AGENDAMENTOS (sem auth)
-- ============================================
-- Permite criação de agendamentos sem login (cliente marcando)
CREATE POLICY "appointments_public_insert" ON appointments FOR INSERT WITH CHECK (true);

-- Permite leitura de serviços/profissionais públicos
CREATE POLICY "services_public_select" ON services FOR SELECT USING (active = true);
CREATE POLICY "professionals_public_select" ON professionals FOR SELECT USING (active = true);

SELECT 'Tabelas criadas com sucesso!' AS message;