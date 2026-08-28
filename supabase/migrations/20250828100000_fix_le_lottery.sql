-- =============================================================================
-- Correção da Loteria e Concessão de Limited Edition (LE)
-- 1. Remove a restrição que exigia le_image_path obrigatório (permite LE com arte padrão ou arte LE dedicada)
-- 2. Garante probabilidade 100% (1.0) quando quota = pool = 1 ou quando remaining >= denom
-- 3. Garante que se o target pool foi atingido mas ainda restam cotas LE, elas continuam sendo distribuídas
-- =============================================================================

create or replace function public.claim_card(p_card_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_card public.cards%rowtype;
  v_is_le boolean := false;
  v_remaining int := 0;
  v_claims_so_far int := 0;
  v_denom int := 1;
  v_p numeric := 0.0;
  v_claim_id uuid;
begin
  if v_user_id is null then
    return json_build_object(
      'ok', false,
      'error', 'not_authenticated',
      'message', 'Faça login para salvar.'
    );
  end if;

  select * into v_card
  from public.cards
  where id = p_card_id
  for update;

  if not found or v_card.is_public is not true or v_card.is_active is not true then
    return json_build_object(
      'ok', false,
      'error', 'not_found',
      'message', 'Card não disponível para salvar.'
    );
  end if;

  -- Se o usuário já salvou este card anteriormente
  if exists (
    select 1 from public.claims
    where user_id = v_user_id and card_id = p_card_id
  ) then
    select is_le into v_is_le
    from public.claims
    where user_id = v_user_id and card_id = p_card_id;

    return json_build_object(
      'ok', true,
      'already', true,
      'is_le', coalesce(v_is_le, false),
      'message', 'Já está no seu álbum'
    );
  end if;

  -- Validação da janela de drop
  if v_card.drop_starts_at is null or v_card.drop_ends_at is null then
    return json_build_object(
      'ok', false,
      'error', 'no_window',
      'message', 'Este card não tem janela de drop.'
    );
  end if;

  if now() < v_card.drop_starts_at or now() > v_card.drop_ends_at then
    return json_build_object(
      'ok', false,
      'error', 'outside_window',
      'message', 'Fora da janela de drop. Não é possível salvar.'
    );
  end if;

  -- Sorteio de Limited Edition (LE)
  if v_card.le_enabled
     and v_card.le_quota > 0
     and v_card.le_awarded < v_card.le_quota
  then
    v_remaining := v_card.le_quota - v_card.le_awarded;

    select count(*)::int into v_claims_so_far
    from public.claims
    where card_id = p_card_id;

    -- Se pool <= 1 ou se o número de cotas restantes for >= vagas restantes no pool, chance é 100%
    v_denom := greatest(1, v_card.le_target_pool - v_claims_so_far);
    
    if v_remaining >= v_denom or v_card.le_target_pool <= 1 then
      v_p := 1.0;
    else
      v_p := least(1.0, greatest(0.0, v_remaining::numeric / v_denom::numeric));
    end if;

    if random() < v_p or v_p >= 1.0 then
      v_is_le := true;
      update public.cards
      set le_awarded = le_awarded + 1
      where id = p_card_id;
    end if;
  end if;

  insert into public.claims (user_id, card_id, is_le)
  values (v_user_id, p_card_id, v_is_le)
  returning id into v_claim_id;

  return json_build_object(
    'ok', true,
    'already', false,
    'is_le', v_is_le,
    'claim_id', v_claim_id,
    'message', case
      when v_is_le then 'LE conquistada! Você tirou uma versão Limited Edition rara!'
      else 'Card salvo no seu álbum com sucesso!'
    end
  );
exception
  when unique_violation then
    return json_build_object(
      'ok', true,
      'already', true,
      'message', 'Já está no seu álbum'
    );
end;
$$;

revoke all on function public.claim_card(uuid) from public;
grant execute on function public.claim_card(uuid) to authenticated;
