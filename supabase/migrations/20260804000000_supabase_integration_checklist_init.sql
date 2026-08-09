-- ============================================================================
-- SUPABASE INTEGRATION CHECKLIST MASTER MIGRATION
-- Migration: 20260804000000_supabase_integration_checklist_init.sql
-- Description: Complete Database Init, RLS Policies, Realtime Setup, & Storage Config
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1️⃣ DATABASE INITIALIZATION: SCHEMAS, ENUMS, & TABLES
-- ----------------------------------------------------------------------------

-- App Role Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_plan') THEN
    CREATE TYPE public.tenant_plan AS ENUM ('free', 'pro', 'enterprise');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
    CREATE TYPE public.tenant_role AS ENUM ('owner', 'staff', 'viewer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'pending', 'paid', 'failed', 'refunded', 'cod'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
    CREATE TYPE public.sync_status AS ENUM ('pending', 'running', 'completed', 'failed');
  END IF;
END
$$;

-- =============== HELPER: updated_at Trigger ===============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============== PROFILES ===============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============== USER ROLES ===============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- =============== SECURITY DEFINER HELPERS ===============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== TENANTS & MEMBERS ===============
CREATE TABLE IF NOT EXISTS public.tenants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  owner_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan           public.tenant_plan   NOT NULL DEFAULT 'free',
  status         public.tenant_status NOT NULL DEFAULT 'active',
  settings       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.tenant_role NOT NULL DEFAULT 'staff',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id uuid, _user_id uuid, _role public.tenant_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR public.is_tenant_member(_tenant_id, _user_id);
$$;

-- Default tenant seed for fallback
INSERT INTO public.tenants (slug, name, plan, status)
VALUES ('default', 'Default Store', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- =============== SYNCHRONIZATION TABLES ===============
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_type       text NOT NULL, -- e.g. 'whatsapp_catalog_sync', 'meta_pixel_sync', 'media_optimization'
  status         public.sync_status NOT NULL DEFAULT 'pending',
  payload        jsonb DEFAULT '{}'::jsonb,
  result         jsonb DEFAULT '{}'::jsonb,
  error_message  text,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  level       text NOT NULL DEFAULT 'info', -- 'info', 'warn', 'error'
  message     text NOT NULL,
  details     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant ON public.sync_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_job ON public.sync_logs(job_id);

-- ----------------------------------------------------------------------------
-- 2️⃣ RLS POLICIES (MULTI-TENANT ISOLATION & RBAC)
-- ----------------------------------------------------------------------------

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Grants to roles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_jobs TO authenticated;
GRANT SELECT, INSERT ON public.sync_logs TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Authenticated view profiles" ON public.profiles;
CREATE POLICY "Authenticated view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Sync Jobs RLS Policies
DROP POLICY IF EXISTS "Tenant members view sync jobs" ON public.sync_jobs;
CREATE POLICY "Tenant members view sync jobs"
  ON public.sync_jobs FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Tenant members insert sync jobs" ON public.sync_jobs;
CREATE POLICY "Tenant members insert sync jobs"
  ON public.sync_jobs FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Tenant members update sync jobs" ON public.sync_jobs;
CREATE POLICY "Tenant members update sync jobs"
  ON public.sync_jobs FOR UPDATE TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()))
  WITH CHECK (public.can_manage_tenant(tenant_id, auth.uid()));

-- Sync Logs RLS Policies
DROP POLICY IF EXISTS "Tenant members view sync logs" ON public.sync_logs;
CREATE POLICY "Tenant members view sync logs"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (public.can_manage_tenant(tenant_id, auth.uid()));

-- ----------------------------------------------------------------------------
-- 3️⃣ REALTIME FEATURES
-- ----------------------------------------------------------------------------

-- Enable Postgres Realtime on critical tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;
    EXCEPTION WHEN duplicate_object THEN END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_jobs;
    EXCEPTION WHEN duplicate_object THEN END;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 4️⃣ STORAGE CONFIGURATION
-- ----------------------------------------------------------------------------

-- Ensure required buckets exist in storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('products', 'products', true),
  ('media', 'media', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage Policies on storage.objects
DROP POLICY IF EXISTS "Public Storage Read Products & Media" ON storage.objects;
CREATE POLICY "Public Storage Read Products & Media"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products', 'media', 'product-images', 'uploads'));

DROP POLICY IF EXISTS "Authenticated Upload Products & Media" ON storage.objects;
CREATE POLICY "Authenticated Upload Products & Media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('products', 'media', 'product-images', 'uploads'));

DROP POLICY IF EXISTS "Authenticated Delete Products & Media" ON storage.objects;
CREATE POLICY "Authenticated Delete Products & Media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('products', 'media', 'product-images', 'uploads'));

DROP POLICY IF EXISTS "Private Read Documents" ON storage.objects;
CREATE POLICY "Private Read Documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated Upload Documents" ON storage.objects;
CREATE POLICY "Authenticated Upload Documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- ----------------------------------------------------------------------------
-- 5️⃣ SECURITY PERMISSION SANITIZATION
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant(UUID, UUID) TO authenticated, service_role;
