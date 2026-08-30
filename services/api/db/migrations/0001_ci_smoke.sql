-- CI smoke migration: verifies the minimum database contract used by the API queue.
create table if not exists public._enjaz_ci_probe (
  id integer primary key,
  checked_at timestamptz not null default now()
);
insert into public._enjaz_ci_probe(id) values (1) on conflict (id) do update set checked_at=now();
