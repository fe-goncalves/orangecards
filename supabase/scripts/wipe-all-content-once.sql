-- =============================================================================
-- ORANGE CARDS — Zerar conteúdo do banco (claims + cards + collections)
-- =============================================================================
-- APENAS pré-lançamento / reset total de conteúdo.
-- NÃO apaga auth.users, profiles, storage files nem admins.
--
-- Ordem: claims → cards → collections (FKs + travas de imutabilidade).
-- Exige a frase de confirmação abaixo.
-- =============================================================================

do $$
declare
  -- >>> CONFIRME alterando para exatamente: ZERAR_TUDO_COLECOES_CARDS_CLAIMS
  v_confirm text := 'TROQUE_ESTA_FRASE';
  n_claims int;
  n_cards int;
  n_collections int;
begin
  if v_confirm is distinct from 'ZERAR_TUDO_COLECOES_CARDS_CLAIMS' then
    raise exception
      'Abortado. Edite v_confirm para ZERAR_TUDO_COLECOES_CARDS_CLAIMS neste script.';
  end if;

  select count(*)::int into n_claims from public.claims;
  select count(*)::int into n_cards from public.cards;
  select count(*)::int into n_collections from public.collections;

  raise notice 'Será apagado — claims: %, cards: %, collections: %',
    n_claims, n_cards, n_collections;

  -- 1) Desliga travas de claims
  drop trigger if exists claims_no_delete on public.claims;
  drop trigger if exists claims_no_truncate on public.claims;

  -- 2) Claims primeiro (FK RESTRICT em cards)
  truncate table public.claims;

  -- 3) Cards (cascade de storage path é só metadado; arquivos no bucket ficam)
  truncate table public.cards cascade;

  -- 4) Collections
  truncate table public.collections cascade;

  -- 5) Religa travas de claims
  create trigger claims_no_delete
    before delete on public.claims
    for each row
    execute function public.claims_forbid_mutation();

  create trigger claims_no_truncate
    before truncate on public.claims
    for each statement
    execute function public.claims_forbid_mutation();

  raise notice 'Reset concluído. Travas de claims reativadas.';
end $$;

-- Verificação
select
  (select count(*)::int from public.claims) as claims_total,
  (select count(*)::int from public.cards) as cards_total,
  (select count(*)::int from public.collections) as collections_total;
