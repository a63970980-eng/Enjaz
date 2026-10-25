-- Revoking an integration connection marks the stored credential as unusable.
-- The original status constraint predates revocation and rejected the value,
-- which made every revoke request fail at the database boundary.
begin;

alter table public.integration_connections
  drop constraint if exists integration_connections_status_check;

alter table public.integration_connections
  add constraint integration_connections_status_check
  check (status in ('active','disabled','expired','error','revoked'));

commit;
