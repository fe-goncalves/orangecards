-- Métricas só para admin (security definer + is_admin)

create or replace function public.admin_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return json_build_object(
    'collectors', (select count(distinct user_id)::int from public.claims),
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
          c.order_display,
          (select count(*)::int from public.claims cl where cl.card_id = c.id) as saves,
          (select count(*)::int from public.claims cl where cl.card_id = c.id and cl.is_le) as le_saves
        from public.cards c
        where c.is_public
      ) t
    ),
    'recent', (
      select coalesce(json_agg(row_to_json(r)), '[]'::json)
      from (
        select
          cl.claimed_at,
          cl.is_le,
          c.code,
          c.number,
          c.title
        from public.claims cl
        join public.cards c on c.id = cl.card_id
        order by cl.claimed_at desc
        limit 25
      ) r
    )
  );
end;
$$;

revoke all on function public.admin_metrics() from public;
grant execute on function public.admin_metrics() to authenticated;
