-- Restringe resolução de e-mail: só service_role (API server).
-- Evita que anon colha e-mail a partir de nickname.

revoke all on function public.resolve_login_identifier(text) from public;
revoke all on function public.resolve_login_identifier(text) from anon;
revoke all on function public.resolve_login_identifier(text) from authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;
