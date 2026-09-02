-- =============================================================================
-- ORANGE CARDS — Script de Go-Live (rodar no momento oficial do lançamento)
-- =============================================================================
-- ATENÇÃO: isso apaga TODOS os claims de teste e zera contadores de LE.
-- Não execute antes da hora.

begin;

-- 1. Remove todos os cards colecionados durante testes
truncate table public.claims;

-- 2. Zera contador de LEs entregues em cada card
update public.cards
set le_awarded = 0
where le_awarded > 0;

commit;

-- Verificação pós-limpeza
select
  (select count(*)::int from public.claims) as claims_total,
  (select count(*)::int from public.claims where is_le) as le_total,
  (select coalesce(sum(le_awarded), 0)::int from public.cards) as le_awarded_sum;
