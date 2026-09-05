-- =============================================================================
-- Profiles: nickname único de verdade + validação server-side anti-injection
-- + claim_card unique_violation com is_le
-- + coleção pública via profiles (sem user_id na resposta)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Validação canônica de nickname (espelha src/lib/nickname.ts)
-- ---------------------------------------------------------------------------
create or replace function public.is_valid_nickname_format(p_nickname text)
returns boolean
language plpgsql
immutable
as $$
declare
  v text := trim(coalesce(p_nickname, ''));
  v_lower text;
begin
  if v is null or length(v) < 2 or length(v) > 32 then
    return false;
  end if;
  -- só ASCII letras/números/_/- (bloqueia espaços, pontos, unicode, tags)
  if v !~ '^[a-zA-Z0-9_-]+$' then
    return false;
  end if;
  if left(v, 1) in ('.', '-', '_') then
    return false;
  end if;
  if right(v, 1) in ('.', '-', '_') then
    return false;
  end if;
  -- "--" ou markup (charset já limita, mas reforça)
  if position('--' in v) > 0 or v ~ '[<>`]' then
    return false;
  end if;
  -- tokens reservados / injection (match exato, case-insensitive)
  v_lower := lower(v);
  if v_lower in (
    'select', 'insert', 'update', 'delete', 'drop', 'union', 'script',
    'javascript', 'onerror', 'onload', 'ignore', 'system', 'prompt',
    'assistant', 'admin', 'null', 'undefined'
  ) then
    return false;
  end if;
  return true;
end;
$$;

revoke all on function public.is_valid_nickname_format(text) from public;
grant execute on function public.is_valid_nickname_format(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Tabela profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  nickname_normalized text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_normalized_key unique (nickname_normalized),
  constraint profiles_nickname_format_chk check (public.is_valid_nickname_format(nickname)),
  constraint profiles_nickname_norm_chk check (nickname_normalized = lower(nickname))
);

create index if not exists profiles_nickname_normalized_idx
  on public.profiles (nickname_normalized);

alter table public.profiles enable row level security;

-- Sem policies de SELECT/INSERT/UPDATE para anon/authenticated:
-- leitura/escrita só via RPCs e triggers security definer.

drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_no_direct_write" on public.profiles;

-- ---------------------------------------------------------------------------
-- 3) Backfill a partir de auth.users (desambiguar colisões)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_nick text;
  v_base text;
  v_norm text;
  v_try text;
  v_n int;
begin
  for r in
    select u.id, coalesce(trim(u.raw_user_meta_data->>'nickname'), '') as raw_nick
    from auth.users u
    where not exists (select 1 from public.profiles p where p.user_id = u.id)
    order by u.created_at asc nulls last, u.id asc
  loop
    v_nick := regexp_replace(r.raw_nick, '[^a-zA-Z0-9_-]', '', 'g');
    if length(v_nick) < 2 or not public.is_valid_nickname_format(v_nick) then
      v_base := 'player_' || substr(replace(r.id::text, '-', ''), 1, 8);
    else
      v_base := v_nick;
    end if;

    v_try := left(v_base, 32);
    v_norm := lower(v_try);
    v_n := 0;

    while exists (
      select 1 from public.profiles where nickname_normalized = lower(v_try)
    ) or not public.is_valid_nickname_format(v_try) loop
      v_n := v_n + 1;
      v_try := left(v_base, greatest(1, 32 - length('_' || v_n::text))) || '_' || v_n::text;
      -- se ainda inválido (ex. termina com _), força player_…
      if not public.is_valid_nickname_format(v_try) then
        v_try := 'player_' || substr(replace(r.id::text, '-', ''), 1, 8) || v_n::text;
        v_try := left(v_try, 32);
      end if;
      if v_n > 50 then
        v_try := 'u' || substr(replace(r.id::text, '-', ''), 1, 31);
        exit;
      end if;
    end loop;

    insert into public.profiles (user_id, nickname, nickname_normalized)
    values (r.id, v_try, lower(v_try))
    on conflict (user_id) do nothing;

    -- mantém metadata alinhada
    update auth.users
    set raw_user_meta_data =
      coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nickname', v_try)
    where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Trigger: signup cria profile; nick inválido/ocupado aborta o cadastro
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_nick text := trim(coalesce(new.raw_user_meta_data->>'nickname', ''));
begin
  if not public.is_valid_nickname_format(v_nick) then
    raise exception 'invalid_nickname' using errcode = 'P0001';
  end if;

  insert into public.profiles (user_id, nickname, nickname_normalized)
  values (new.id, v_nick, lower(v_nick));

  return new;
exception
  when unique_violation then
    raise exception 'nickname_taken' using errcode = 'P0001';
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- Metadata nickname não pode divergir de profiles (profiles = fonte da verdade)
create or replace function public.guard_auth_nickname_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_meta_nick text := trim(coalesce(new.raw_user_meta_data->>'nickname', ''));
  v_profile_nick text;
begin
  select p.nickname into v_profile_nick
  from public.profiles p
  where p.user_id = new.id;

  if v_profile_nick is not null and v_meta_nick is distinct from v_profile_nick then
    new.raw_user_meta_data :=
      coalesce(new.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('nickname', v_profile_nick);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_nickname_guard on auth.users;
create trigger on_auth_user_nickname_guard
  before update on auth.users
  for each row
  execute function public.guard_auth_nickname_metadata();

-- ---------------------------------------------------------------------------
-- 5) RPC: set_my_nickname (authenticated) — única forma de trocar nick
-- ---------------------------------------------------------------------------
create or replace function public.set_my_nickname(p_nickname text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_nick text := trim(coalesce(p_nickname, ''));
begin
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if not public.is_valid_nickname_format(v_nick) then
    return json_build_object('ok', false, 'error', 'invalid_nickname', 'message', 'Nickname inválido.');
  end if;

  if exists (
    select 1 from public.profiles
    where nickname_normalized = lower(v_nick)
      and user_id <> v_uid
  ) then
    return json_build_object('ok', false, 'error', 'nickname_taken', 'message', 'Esse nickname já está em uso.');
  end if;

  insert into public.profiles (user_id, nickname, nickname_normalized, updated_at)
  values (v_uid, v_nick, lower(v_nick), now())
  on conflict (user_id) do update
    set nickname = excluded.nickname,
        nickname_normalized = excluded.nickname_normalized,
        updated_at = now();

  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nickname', v_nick)
  where id = v_uid;

  return json_build_object('ok', true, 'nickname', v_nick);
end;
$$;

revoke all on function public.set_my_nickname(text) from public;
grant execute on function public.set_my_nickname(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Disponibilidade / resolve login → profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_nickname_available(p_nickname text)
returns json
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_nick text := trim(coalesce(p_nickname, ''));
  v_uid uuid := auth.uid();
  v_taken boolean := false;
begin
  if not public.is_valid_nickname_format(v_nick) then
    return json_build_object('ok', false, 'available', false, 'error', 'invalid');
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.nickname_normalized = lower(v_nick)
      and (v_uid is null or p.user_id <> v_uid)
  ) into v_taken;

  return json_build_object(
    'ok', true,
    'available', not v_taken,
    'nickname', v_nick
  );
end;
$$;

revoke all on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to anon, authenticated;

create or replace function public.resolve_login_identifier(p_identifier text)
returns json
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_raw text := trim(coalesce(p_identifier, ''));
  v_email text;
begin
  if length(v_raw) < 2 or length(v_raw) > 200 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  -- bloqueia markup / injection no identificador
  if v_raw ~* '[<>`]|--|/\*|\*/' then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  if position('@' in v_raw) > 1 then
    select u.email into v_email
    from auth.users u
    where lower(u.email) = lower(v_raw)
    limit 1;

    if v_email is null then
      return json_build_object('ok', true, 'email', lower(v_raw));
    end if;
    return json_build_object('ok', true, 'email', v_email);
  end if;

  if not public.is_valid_nickname_format(v_raw) then
    return json_build_object('ok', false, 'error', 'invalid_nickname');
  end if;

  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.nickname_normalized = lower(v_raw)
  limit 1;

  if v_email is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  return json_build_object('ok', true, 'email', v_email);
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
revoke all on function public.resolve_login_identifier(text) from anon;
revoke all on function public.resolve_login_identifier(text) from authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;

-- ---------------------------------------------------------------------------
-- 7) Coleção pública via profiles (sem user_id; lookup preferencial por nick)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_collection_by_user(p_identifier text)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_nickname text;
  v_id text := trim(coalesce(p_identifier, ''));
  v_result json;
begin
  if length(v_id) = 0 or length(v_id) > 64 then
    return json_build_object('ok', false, 'error', 'invalid_identifier');
  end if;

  if v_id ~* '[<>`]|--|/\*|\*/' then
    return json_build_object('ok', false, 'error', 'invalid_identifier');
  end if;

  -- UUID ainda funciona para links legados /u/<uuid>
  begin
    v_user_id := v_id::uuid;
  exception when others then
    v_user_id := null;
  end;

  if v_user_id is not null then
    select p.nickname, p.user_id
    into v_nickname, v_user_id
    from public.profiles p
    where p.user_id = v_user_id;
  end if;

  if v_user_id is null then
    if not public.is_valid_nickname_format(v_id) then
      return json_build_object('ok', false, 'error', 'user_not_found');
    end if;

    select p.nickname, p.user_id
    into v_nickname, v_user_id
    from public.profiles p
    where p.nickname_normalized = lower(v_id)
    limit 1;
  end if;

  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'user_not_found');
  end if;

  select json_build_object(
    'ok', true,
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

revoke all on function public.get_public_collection_by_user(text) from public;
grant execute on function public.get_public_collection_by_user(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8) claim_card: unique_violation devolve is_le
-- ---------------------------------------------------------------------------
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

  if v_card.le_enabled
     and v_card.le_quota > 0
     and v_card.le_awarded < v_card.le_quota
  then
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
