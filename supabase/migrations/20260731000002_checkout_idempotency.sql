-- Checkout hotfix: make the client-generated request key durable so retries
-- cannot create duplicate orders. Safe to run repeatedly on existing databases.

alter table public.orders
  add column if not exists idempotency_key uuid;

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'Client-generated UUID used to make checkout retries idempotent.';
