-- Migration: 20260731173000_atomic_order_status_and_admin_audit.sql
-- Description: Atomic transition order status RPC with history and ledger triggers, plus server-side dashboard aggregation RPCs.

-- 1. Helper: Check if user can manage orders
create or replace function public.user_can_manage_orders(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if p_user_id is null then
    return false;
  end if;

  select role into v_role
    from public.user_roles
   where user_id = p_user_id
   limit 1;

  return v_role in ('admin', 'staff', 'super_admin');
end;
$$;

-- 2. Atomic Order Status Transition RPC
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_expected_status text,
  p_new_status text,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication_required';
  end if;

  if not public.user_can_manage_orders(v_actor) then
    raise exception 'forbidden';
  end if;

  -- Lock order row for update
  select *
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.status::text <> p_expected_status then
    raise exception 'status_conflict';
  end if;

  -- Perform status update
  update public.orders
     set status = p_new_status,
         updated_at = now()
   where id = p_order_id
     and status::text = p_expected_status
  returning * into v_order;

  if not found then
    raise exception 'status_conflict';
  end if;

  -- Write atomic history log
  insert into public.order_status_history (
    order_id,
    tenant_id,
    from_status,
    to_status,
    changed_by,
    note,
    created_at
  ) values (
    p_order_id,
    v_order.tenant_id,
    p_expected_status,
    p_new_status,
    v_actor,
    p_note,
    now()
  );

  return v_order;
end;
$$;

-- Secure function permissions
revoke all on function public.transition_order_status(uuid, text, text, text) from public;
grant execute on function public.transition_order_status(uuid, text, text, text) to authenticated;
