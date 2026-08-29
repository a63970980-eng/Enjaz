-- ENJAZ migration 001: initial multi-tenant workforce schema
begin;

create extension if not exists pgcrypto;

create type employee_status as enum ('draft','active','paused','archived');
create type task_status as enum ('queued','planning','awaiting_approval','executing','completed','failed','cancelled');
create type approval_status as enum ('pending','approved','rejected','expired');

create table organizations (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, created_at timestamptz not null default now());
create table workspaces (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, slug text not null, created_at timestamptz not null default now(), unique(organization_id,slug));
create table users (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, email text not null, name text not null, role text not null default 'member' check(role in ('owner','admin','manager','member')), created_at timestamptz not null default now(), unique(organization_id,email));
create table workspace_members (workspace_id uuid not null references workspaces(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, role text not null default 'member' check(role in ('manager','member','viewer')), created_at timestamptz not null default now(), primary key(workspace_id,user_id));
create table ai_employees (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, name text not null, role text not null, goal text, skills jsonb not null default '[]', tools jsonb not null default '[]', memory_config jsonb not null default '{}', permissions jsonb not null default '[]', model text not null default 'default', budget_cents bigint not null default 0 check(budget_cents>=0), schedule jsonb not null default '{}', status employee_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table tasks (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, employee_id uuid references ai_employees(id) on delete set null, title text not null, objective text not null, status task_status not null default 'queued', priority smallint not null default 5 check(priority between 1 and 10), input jsonb not null default '{}', output jsonb, error text, created_at timestamptz not null default now(), started_at timestamptz, completed_at timestamptz);
create table approvals (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, task_id uuid not null references tasks(id) on delete cascade, action text not null, reason text, payload jsonb not null default '{}', status approval_status not null default 'pending', decided_by uuid references users(id) on delete set null, decided_at timestamptz, created_at timestamptz not null default now());
create table audit_events (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, task_id uuid references tasks(id) on delete set null, employee_id uuid references ai_employees(id) on delete set null, event_type text not null, actor_type text not null, action text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index idx_workspaces_org on workspaces(organization_id);
create index idx_members_user on workspace_members(user_id);
create index idx_employees_workspace on ai_employees(workspace_id);
create index idx_tasks_workspace_status on tasks(workspace_id,status);
create index idx_approvals_workspace_status on approvals(workspace_id,status);
create index idx_audit_workspace_created on audit_events(workspace_id,created_at desc);

create table schema_migrations (version text primary key, applied_at timestamptz not null default now());
insert into schema_migrations(version) values ('001_initial') on conflict do nothing;

commit;
