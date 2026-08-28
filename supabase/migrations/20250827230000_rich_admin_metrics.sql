-- Métricas aprofundadas para painel admin
-- Retorna dados agregados, lista de usuários/colecionadores com email/nickname, detalhes por card e histórico de LEs

create or replace function public.admin_metrics()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _result json;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select json_build_object(
    'collectors', (select count(distinct user_id)::int from public.claims),
    'users_total', (select count(*)::int from auth.users),
    'claims_total', (select count(*)::int from public.claims),
    'le_total', (select count(*)::int from public.claims where is_le),
    'cards_public', (select count(*)::int from public.cards where is_public),
    'cards_live', (
      select count(*)::int from public.cards
      where is_public and is_active
        and drop_starts_at is not null and drop_ends_at is not null
        and now() between drop_starts_at and drop_ends_at
    ),
    'by_card', (
      select coalesce(json_agg(row_to_json(t) order by t.order_display), '[]'::json)
      from (
        select
          c.id,
          c.code,
          c.number,
          c.title,
          c.image_path,
          c.le_image_path,
          c.is_public,
          c.is_active,
          c.drop_starts_at,
          c.drop_ends_at,
          c.order_display,
          c.le_enabled,
          c.le_quota,
          c.le_awarded,
          (select count(*)::int from public.claims cl where cl.card_id = c.id) as saves,
          (select count(*)::int from public.claims cl where cl.card_id = c.id and cl.is_le) as le_saves,
          (
            select coalesce(json_agg(json_build_object(
              'user_id', clm.user_id,
              'email', coalesce(u.email, '—'),
              'nickname', coalesce(u.raw_user_meta_data->>'nickname', ''),
              'claimed_at', clm.claimed_at,
              'is_le', clm.is_le
            ) order by clm.claimed_at desc), '[]'::json)
            from public.claims clm
            left join auth.users u on u.id = clm.user_id
            where clm.card_id = c.id
          ) as claimants
        from public.cards c
        where c.is_public
      ) t
    ),
    'users_list', (
      select coalesce(json_agg(row_to_json(u_row) order by u_row.total_cards desc, u_row.last_claim desc nulls last), '[]'::json)
      from (
        select
          u.id as user_id,
          coalesce(u.email, '—') as email,
          coalesce(u.raw_user_meta_data->>'nickname', '') as nickname,
          u.created_at,
          (select count(*)::int from public.claims cl where cl.user_id = u.id) as total_cards,
          (select count(*)::int from public.claims cl where cl.user_id = u.id and cl.is_le) as total_le,
          (select max(cl.claimed_at) from public.claims cl where cl.user_id = u.id) as last_claim,
          (
            select coalesce(json_agg(json_build_object(
              'card_id', cl.card_id,
              'code', c.code,
              'number', c.number,
              'title', c.title,
              'is_le', cl.is_le,
              'claimed_at', cl.claimed_at
            ) order by cl.claimed_at desc), '[]'::json)
            from public.claims cl
            left join public.cards c on c.id = cl.card_id
            where cl.user_id = u.id
          ) as cards
        from auth.users u
      ) u_row
    ),
    'recent', (
      select coalesce(json_agg(row_to_json(r)), '[]'::json)
      from (
        select
          cl.claimed_at,
          cl.is_le,
          cl.user_id,
          coalesce(u.email, '—') as email,
          coalesce(u.raw_user_meta_data->>'nickname', '') as nickname,
          c.code,
          c.number,
          c.title
        from public.claims cl
        join public.cards c on c.id = cl.card_id
        left join auth.users u on u.id = cl.user_id
        order by cl.claimed_at desc
        limit 50
      ) r
    )
  ) into _result;

  return _result;
end;
$$;

revoke all on function public.admin_metrics() from public;
grant execute on function public.admin_metrics() to authenticated;
