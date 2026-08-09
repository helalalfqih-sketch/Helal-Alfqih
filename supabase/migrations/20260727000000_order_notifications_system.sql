-- ─────────────────────────────────────────────────────────────────────────────
-- Order Notifications System Migration — Phase 11 🔔
-- Multi-Tenant isolated notification templates, notifications log, and triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Table: public.notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type text NOT NULL, -- e.g., 'new_order_customer', 'order_shipped_customer', 'new_order_admin'
    channel text NOT NULL, -- e.g., 'email', 'whatsapp', 'in_app'
    subject_template text, -- For email notifications
    body_template text NOT NULL, -- Supports markdown/html/plain text
    is_active boolean DEFAULT TRUE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_tenant_type_channel UNIQUE (tenant_id, type, channel)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable access for authenticated tenants on notification_templates" ON public.notification_templates
    FOR ALL USING (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    ) WITH CHECK (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table: public.notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    type text NOT NULL, -- e.g., 'new_order_customer', 'order_shipped_customer'
    channel text NOT NULL, -- e.g., 'email', 'whatsapp', 'in_app'
    recipient text NOT NULL, -- e.g., customer_email, admin_user_id, phone_number
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'sent', 'failed', 'read'
    subject text,
    content text NOT NULL,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable access for authenticated tenants on notifications" ON public.notifications
    FOR ALL USING (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    ) WITH CHECK (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Trigger Function & Database Trigger for Order Status Changes
CREATE OR REPLACE FUNCTION public.handle_order_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    notification_payload jsonb;
    server_function_url text := 'https://your-app-domain.com/api/notifications/process-order-event';
    server_function_api_key text := 'YOUR_SERVER_FUNCTION_API_KEY';
BEGIN
    IF (TG_OP = 'INSERT') THEN
        notification_payload := jsonb_build_object(
            'event_type', 'order_created',
            'order_id', NEW.id,
            'tenant_id', NEW.tenant_id,
            'status', NEW.status,
            'customer_email', NEW.customer_email,
            'total', NEW.total,
            'created_at', NEW.created_at
        );
    ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
        notification_payload := jsonb_build_object(
            'event_type', 'order_status_updated',
            'order_id', NEW.id,
            'tenant_id', NEW.tenant_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'customer_email', NEW.customer_email,
            'total', NEW.total,
            'updated_at', NEW.updated_at
        );
    ELSE
        RETURN NEW;
    END IF;

    -- Call net.http_post if pg_net extension is available
    BEGIN
      PERFORM net.http_post(
          server_function_url,
          notification_payload::jsonb,
          jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || server_function_api_key
          )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silence external network errors inside DB trigger so order transactions complete safely
      NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_notification_trigger();
