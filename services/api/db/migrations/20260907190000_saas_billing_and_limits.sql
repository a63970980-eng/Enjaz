create table if not exists public.billing_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  monthly_price_cents integer not null default 0 check(monthly_price_cents >= 0),
  max_employees integer not null default 3 check(max_employees > 0),
  max_tasks_month integer not null default 100 check(max_tasks_month > 0),
  max_integrations integer not null default 2 check(max_integrations >= 0),
  included_ai_cost_cents integer not null default 0 check(included_ai_cost_cents >= 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.billing_plans(id,name,description,monthly_price_cents,max_employees,max_tasks_month,max_integrations,included_ai_cost_cents,features)
values
 ('starter','Starter','للشركات الصغيرة لبناء أول قوة عاملة رقمية',0,3,100,2,0,'["3 موظفين رقميين","100 مهمة شهريًا","2 تكاملات"]'::jsonb),
 ('growth','Growth','للفرق التي تدير عمليات يومية متعددة',4900,15,1000,10,1000,'["15 موظفًا","1000 مهمة شهريًا","10 تكاملات","ذاكرة وتشغيل متقدم"]'::jsonb),
 ('enterprise','Enterprise','قوة عاملة رقمية على مستوى المؤسسة',19900,100,10000,50,10000,'["100 موظف","10000 مهمة شهريًا","50 تكاملًا","حوكمة ومراقبة متقدمة"]'::jsonb)
on conflict(id) do update set name=excluded.name,description=excluded.description,monthly_price_cents=excluded.monthly_price_cents,max_employees=excluded.max_employees,max_tasks_month=excluded.max_tasks_month,max_integrations=excluded.max_integrations,included_ai_cost_cents=excluded.included_ai_cost_cents,features=excluded.features,active=true;

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  status text not null default 'active' check(status in ('trialing','active','past_due','cancelled')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.workspace_subscriptions(workspace_id,plan_id,status)
select w.id,'starter','active' from public.workspaces w
where not exists(select 1 from public.workspace_subscriptions s where s.workspace_id=w.id);

create index if not exists workspace_subscriptions_plan_idx on public.workspace_subscriptions(plan_id,status);
alter table public.billing_plans enable row level security;
alter table public.workspace_subscriptions enable row level security;

do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='billing_plans' and policyname='billing_plans_public_select') then
   execute 'create policy billing_plans_public_select on public.billing_plans for select to authenticated using (active)';
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='workspace_subscriptions' and policyname='workspace_subscriptions_member_select') then
   execute 'create policy workspace_subscriptions_member_select on public.workspace_subscriptions for select to authenticated using (private.is_workspace_member(workspace_id))';
 end if;
end $$;
