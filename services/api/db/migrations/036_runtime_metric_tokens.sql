-- Model token usage is measured for every planning call. These additive columns
-- keep that measurement queryable beside latency and cost, without altering the
-- meaning of existing runtime_metrics rows.
begin;

alter table public.runtime_metrics
  add column if not exists input_tokens bigint,
  add column if not exists output_tokens bigint;

comment on column public.runtime_metrics.input_tokens is 'Model prompt tokens reported by the provider.';
comment on column public.runtime_metrics.output_tokens is 'Model completion tokens reported by the provider.';

commit;
