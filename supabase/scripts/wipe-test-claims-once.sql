-- =============================================================================
-- ORANGE CARDS — Limpeza ÚNICA pré-lançamento (só testes)
-- =============================================================================
-- Use isto SOMENTE se os claims atuais forem de teste e você ainda NÃO lançou.
-- Depois do go-live oficial: NÃO rode. Coleções ficam imutáveis de propósito.
--
-- O script exige a frase de confirmação abaixo. Sem ela, não executa.
-- =============================================================================

do $$
declare
  -- >>> CONFIRME alterando para exatamente: LIMPAR_TESTES_PRE_LANCAMENTO
  v_confirm text := 'TROQUE_ESTA_FRASE';
  n int;
begin
  if v_confirm is distinct from 'LIMPAR_TESTES_PRE_LANCAMENTO' then
    raise exception
      'Abortado. Para limpar testes, edite v_confirm para LIMPAR_TESTES_PRE_LANCAMENTO neste script.';
  end if;

  select count(*)::int into n from public.claims;
  raise notice 'Claims que serão apagados: %', n;

  -- Desliga travas só neste bloco
  drop trigger if exists claims_no_delete on public.claims;
  drop trigger if exists claims_no_truncate on public.claims;

  truncate table public.claims;

  update public.cards
  set le_awarded = 0
  where le_awarded > 0;

  -- Religa travas imediatamente
  create trigger claims_no_delete
    before delete on public.claims
    for each row
    execute function public.claims_forbid_mutation();

  create trigger claims_no_truncate
    before truncate on public.claims
    for each statement
    execute function public.claims_forbid_mutation();

  raise notice 'Limpeza concluída. Travas de imutabilidade reativadas.';
end $$;

-- Verificação
select
  (select count(*)::int from public.claims) as claims_total,
  (select count(*)::int from public.claims where is_le) as le_total,
  (select coalesce(sum(le_awarded), 0)::int from public.cards) as le_awarded_sum;
