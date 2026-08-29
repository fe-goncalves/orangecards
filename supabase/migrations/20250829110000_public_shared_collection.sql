-- RPC pública para carregar dados da coleção compartilhada de um usuário
-- Permite lookup por nickname (case-insensitive) ou por UUID do usuário

create or replace function public.get_public_collection_by_user(p_identifier text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_nickname text;
  v_result json;
begin
  if p_identifier is null or length(trim(p_identifier)) = 0 then
    return json_build_object('ok', false, 'error', 'invalid_identifier');
  end if;

  -- 1. Tenta identificar se p_identifier é um UUID válido
  begin
    v_user_id := p_identifier::uuid;
  exception when others then
    v_user_id := null;
  end;

  -- 2. Se for UUID, busca o usuário correspondente
  if v_user_id is not null then
    select coalesce(u.raw_user_meta_data->>'nickname', ''), u.id
    into v_nickname, v_user_id
    from auth.users u
    where u.id = v_user_id;
  end if;

  -- 3. Se não encontrou por UUID, busca pelo nickname (case-insensitive)
  if v_user_id is null then
    select coalesce(u.raw_user_meta_data->>'nickname', ''), u.id
    into v_nickname, v_user_id
    from auth.users u
    where lower(trim(coalesce(u.raw_user_meta_data->>'nickname', ''))) = lower(trim(p_identifier))
    limit 1;
  end if;

  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'user_not_found');
  end if;

  -- 4. Retorna estatísticas e mapeamento de claims do colecionador
  select json_build_object(
    'ok', true,
    'user_id', v_user_id,
    'nickname', coalesce(nullif(trim(v_nickname), ''), 'Colecionador'),
    'claims', (
      select coalesce(json_object_agg(
        cl.card_id,
        json_build_object(
          'is_le', cl.is_le,
          'claimed_at', cl.claimed_at
        )
      ), '{}'::json)
      from public.claims cl
      where cl.user_id = v_user_id
    ),
    'stats', json_build_object(
      'total_claimed', (select count(*)::int from public.claims where user_id = v_user_id),
      'total_le', (select count(*)::int from public.claims where user_id = v_user_id and is_le = true)
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_public_collection_by_user(text) to anon, authenticated;
