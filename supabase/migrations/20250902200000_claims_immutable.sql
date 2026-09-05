-- =============================================================================
-- Claims imutáveis — coleções nunca podem ser apagadas ou zeradas
-- =============================================================================

-- 1) Insert só via RPC security definer; ninguém (anon/auth) apaga ou altera
revoke insert, update, delete, truncate on table public.claims from public, anon, authenticated;

grant select on table public.claims to authenticated;

-- 2) FK: apagar usuário ou card NÃO pode cascatear e levar a coleção junto
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.claims'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.claims drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.claims
  add constraint claims_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete restrict,
  add constraint claims_card_id_fkey
    foreign key (card_id) references public.cards (id) on delete restrict;

-- 3) Trigger: DELETE impossível (inclusive table owner / service role)
create or replace function public.claims_forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ORANGE CARDS: claims são imutáveis. Coleções não podem ser apagadas ou zeradas.';
end;
$$;

drop trigger if exists claims_no_delete on public.claims;
create trigger claims_no_delete
  before delete on public.claims
  for each row
  execute function public.claims_forbid_mutation();

drop trigger if exists claims_no_truncate on public.claims;
create trigger claims_no_truncate
  before truncate on public.claims
  for each statement
  execute function public.claims_forbid_mutation();

-- 4) UPDATE: identidade travada; LE só pode ir de false → true
create or replace function public.claims_guard_update()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.card_id is distinct from old.card_id
     or new.claimed_at is distinct from old.claimed_at then
    raise exception 'ORANGE CARDS: claims são imutáveis. Campos de identidade não podem mudar.';
  end if;

  if old.is_le is true and new.is_le is false then
    raise exception 'ORANGE CARDS: Limited Edition não pode ser revogada.';
  end if;

  return new;
end;
$$;

drop trigger if exists claims_guard_update on public.claims;
create trigger claims_guard_update
  before update on public.claims
  for each row
  execute function public.claims_guard_update();

-- 5) RPC confiável da coleção do usuário logado (não devolve vazio por “falha silenciosa”)
create or replace function public.get_my_collection()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return json_build_object(
      'ok', false,
      'error', 'not_authenticated'
    );
  end if;

  return json_build_object(
    'ok', true,
    'user_id', v_user_id,
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
    )
  );
end;
$$;

revoke all on function public.get_my_collection() from public;
grant execute on function public.get_my_collection() to authenticated;
