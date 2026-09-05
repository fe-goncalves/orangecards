-- =============================================================================
-- ORANGE CARDS — launch-day.sql
-- =============================================================================
-- Este arquivo NÃO limpa mais coleções.
--
-- Se ainda estiver em testes e precisar zerar claims de teste UMA vez:
-- use: supabase/scripts/wipe-test-claims-once.sql
-- (exige frase de confirmação explícita)
--
-- Depois do lançamento oficial: não existe reset. Travas no banco impedem.

select
  (select count(*)::int from public.claims) as claims_total,
  (select count(*)::int from public.claims where is_le) as le_total,
  (select coalesce(sum(le_awarded), 0)::int from public.cards) as le_awarded_sum;
