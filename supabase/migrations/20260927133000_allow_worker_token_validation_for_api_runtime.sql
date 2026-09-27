-- Worker token validation is performed by the authenticated worker Edge Function.
-- Do not expose the SECURITY DEFINER Vault lookup through the public Data API.
revoke execute on function public.enjaz_worker_token_valid(text) from public;
revoke execute on function public.enjaz_worker_token_valid(text) from anon;
grant execute on function public.enjaz_worker_token_valid(text) to service_role;
