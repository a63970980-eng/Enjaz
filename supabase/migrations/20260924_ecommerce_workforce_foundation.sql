-- ENJAZ ecommerce workforce foundation
-- Provider-neutral commerce data layer with workspace isolation.
create table if not exists public.commerce_stores(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null, provider text not null, external_store_id text,
 status text not null default 'connected' check(status in ('connected','paused','error','disconnected')),
 currency text default 'USD', timezone text default 'UTC', metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,provider,external_store_id)
);
create table if not exists public.commerce_products(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 store_id uuid references public.commerce_stores(id) on delete cascade, external_id text, sku text, name text not null,
 status text not null default 'active', price numeric(14,2), cost numeric(14,2), currency text default 'USD',
 inventory_qty numeric(14,2) default 0, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists commerce_products_workspace_idx on public.commerce_products(workspace_id);
create table if not exists public.commerce_orders(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 store_id uuid references public.commerce_stores(id) on delete set null, external_id text, customer_external_id text,
 status text not null default 'pending', fulfillment_status text default 'unfulfilled', payment_status text default 'pending',
 subtotal numeric(14,2) default 0, shipping numeric(14,2) default 0, discount numeric(14,2) default 0,
 total numeric(14,2) default 0, currency text default 'USD', ordered_at timestamptz,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,store_id,external_id)
);
create index if not exists commerce_orders_workspace_status_idx on public.commerce_orders(workspace_id,status,ordered_at desc);
create table if not exists public.commerce_order_items(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 order_id uuid not null references public.commerce_orders(id) on delete cascade, product_id uuid references public.commerce_products(id) on delete set null,
 external_product_id text, sku text, name text, quantity numeric(14,2) default 1, unit_price numeric(14,2) default 0,
 total numeric(14,2) default 0, metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.commerce_customers(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 store_id uuid references public.commerce_stores(id) on delete set null, external_id text, name text, email text, phone text,
 orders_count integer default 0, lifetime_value numeric(14,2) default 0, last_order_at timestamptz,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,store_id,external_id)
);
create table if not exists public.commerce_events(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 store_id uuid references public.commerce_stores(id) on delete set null, event_type text not null, external_event_id text,
 payload jsonb not null default '{}'::jsonb, processed boolean not null default false, created_at timestamptz not null default now(), processed_at timestamptz,
 unique(workspace_id,store_id,external_event_id)
);
alter table public.commerce_stores enable row level security;
alter table public.commerce_products enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
alter table public.commerce_customers enable row level security;
alter table public.commerce_events enable row level security;
