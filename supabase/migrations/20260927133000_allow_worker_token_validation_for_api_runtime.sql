-- Enjaz worker runtime: allow the API runtime to validate the worker token through PostgREST.
-- The function returns only a boolean and compares against the Vault secret; the secret itself is never exposed.
revoke execute on function public.enjaz_worker_token_valid(text) from public;
grant execute on function public.enjaz_worker_token_valid(text) to anon;
