-- =============================================================================
-- Bypass de claim para admin VIP (UID fixo)
-- - pode claimar fora da janela (drops antecipados / testes)
-- - sempre recebe LE quando o card tem le_enabled
-- Somente: cbae6d9d-6544-4010-928f-39061448a56e
-- =============================================================================

insert into public.admins (user_id)
values ('cbae6d9d-6544-4010-928f-39061448a56e'::uuid)
on conflict (user_id) do nothing;

create or replace function public.is_claim_bypass()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = 'cbae6d9d-6544-4010-928f-39061448a56e'::uuid;
$$;

revoke all on function public.is_claim_bypass() from public;
grant execute on function public.is_claim_bypass() to authenticated, anon;

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
  v_bypass boolean := false;
begin
  if v_user_id is null then
    return json_build_object(
      'ok', false,
      'error', 'not_authenticated',
      'message', 'Faça login para salvar.'
    );
  end if;

  v_bypass := (v_user_id = 'cbae6d9d-6544-4010-928f-39061448a56e'::uuid);

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

  -- Janela de drop: bypass ignora antecipado/atrasado
  if not v_bypass then
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
  end if;

  -- LE
  if v_card.le_enabled then
    if v_bypass then
      -- Admin VIP: sempre LE (sem depender de quota/sorteio)
      v_is_le := true;
      if v_card.le_quota > 0 and v_card.le_awarded < v_card.le_quota then
        update public.cards
        set le_awarded = le_awarded + 1
        where id = p_card_id;
      end if;
    elsif v_card.le_quota > 0 and v_card.le_awarded < v_card.le_quota then
      v_remaining := v_card.le_quota - v_card.le_awarded;

      select count(*)::int into v_claims_so_far
      from public.claims
      where card_id = p_card_id;

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
  end if;

  insert into public.claims (user_id, card_id, is_le)
  values (v_user_id, p_card_id, v_is_le)
  returning id into v_claim_id;

  return json_build_object(
    'ok', true,
    'already', false,
    'is_le', v_is_le,
    'claim_id', v_claim_id,
    'bypass', v_bypass,
    'message', case
      when v_is_le then 'LE conquistada! Você tirou uma versão Limited Edition rara!'
      else 'Card salvo no seu álbum com sucesso!'
    end
  );
exception
  when unique_violation then
    select is_le into v_is_le
    from public.claims
    where user_id = auth.uid() and card_id = p_card_id;

    return json_build_object(
      'ok', true,
      'already', true,
      'is_le', coalesce(v_is_le, false),
      'message', 'Já está no seu álbum'
    );
end;
$$;

revoke all on function public.claim_card(uuid) from public;
grant execute on function public.claim_card(uuid) to authenticated;
