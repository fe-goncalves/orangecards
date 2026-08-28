-- Orange Cards — schema canônico v2
-- Coleções multi-ano + cards (number público, code interno, public/active, LE)

create extension if not exists "pgcrypto";

-- =============================================================================
-- COLLECTIONS (ex.: Season 8, Season 9…)
-- =============================================================================

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- 's8', 's9'
  name text not null,                 -- 'Season 8 / 26 II'
  year int,                           -- 2026
  is_active boolean not null default false, -- coleção em destaque no site
  order_display int not null default 0,
  created_at timestamptz not null default now()
);

-- no máximo uma coleção ativa (parcial: enforce via app + índice único parcial)
create unique index collections_one_active
  on public.collections (is_active)
  where is_active = true;

-- =============================================================================
-- CARDS
-- =============================================================================
-- code          = ID interno (único, admin/sistema)
-- number        = numeração pública (ex.: "01", "014") — o que o público vê
-- is_public     = entra no álbum público
-- is_active     = card “vivo”; se public+!active = slot vazio (espaço p/ figurinha)
-- order_display = ordem na grade (admin)

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  code text not null unique,
  number text not null default '',
  title text not null default '',
  subtitle text not null default '',
  description text not null default '',
  image_path text not null default '',
  drop_starts_at timestamptz,
  drop_ends_at timestamptz,
  is_public boolean not null default false,
  is_active boolean not null default false,
  order_display int not null default 0,
  -- Limited Edition
  le_enabled boolean not null default false,
  le_quota int not null default 0,
  le_awarded int not null default 0,
  le_target_pool int not null default 100,
  le_image_path text not null default '',
  created_at timestamptz not null default now(),
  constraint cards_drop_window check (
    drop_starts_at is null
    or drop_ends_at is null
    or drop_ends_at > drop_starts_at
  ),
  constraint cards_le_quota_nonneg check (le_quota >= 0),
  constraint cards_le_awarded_bounds check (le_awarded >= 0 and le_awarded <= greatest(le_quota, 0)),
  constraint cards_le_pool_pos check (le_target_pool >= 1)
);

create index cards_collection_id_idx on public.cards (collection_id);
create index cards_public_order_idx on public.cards (collection_id, is_public, order_display);

-- =============================================================================
-- CLAIMS
-- =============================================================================

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  is_le boolean not null default false,
  unique (user_id, card_id)
);

create index claims_user_id_idx on public.claims (user_id);
create index claims_card_id_idx on public.claims (card_id);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.collections enable row level security;
alter table public.cards enable row level security;
alter table public.claims enable row level security;

-- Público lê coleções ativas (e, via service, admin lê todas)
create policy "collections_select_active"
  on public.collections for select
  to anon, authenticated
  using (is_active = true);

-- Álbum público: cards is_public (ativos e inativos = slots)
create policy "cards_select_public"
  on public.cards for select
  to anon, authenticated
  using (is_public = true);

create policy "claims_select_own"
  on public.claims for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes: só service role / RPC security definer

-- =============================================================================
-- RPC claim_card
-- =============================================================================
-- Regras: auth + card public + active + janela de drop + UNIQUE claim
-- LE: lottery atômica; se ganhar, is_le=true e a arte LE SUBSTITUI a padrão na UI

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
  v_remaining int;
  v_claims_so_far int;
  v_denom int;
  v_p numeric;
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
     and length(trim(v_card.le_image_path)) > 0
  then
    v_remaining := v_card.le_quota - v_card.le_awarded;

    select count(*)::int into v_claims_so_far
    from public.claims
    where card_id = p_card_id;

    v_denom := greatest(1, v_card.le_target_pool - v_claims_so_far);
    v_p := least(1.0, greatest(0.0, v_remaining::numeric / v_denom::numeric));

    if random() < v_p then
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
      when v_is_le then 'LE desbloqueada! A versão Limited Edition substitui a padrão no seu álbum.'
      else 'Card salvo no seu álbum!'
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

-- =============================================================================
-- STORAGE
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cards',
  'cards',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "cards_storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cards');

-- =============================================================================
-- SEED — Season 8 (collection)
-- =============================================================================

do $$
declare
  v_col uuid;
  v_now timestamptz := now();
begin
  insert into public.collections (slug, name, year, is_active, order_display)
  values ('s8', 'Season 8 / 26 II', 2026, true, 8)
  returning id into v_col;

  -- Past, ativo, público (após drop: quem não salvou vê slot vazio)
  insert into public.cards (
    collection_id, code, number, title, subtitle, description, image_path,
    drop_starts_at, drop_ends_at, is_public, is_active, order_display
  ) values
  (
    v_col, 'S8-W01-001', '01', 'Capitão Laranja', 'Liderança · Rodada 1',
    'Líder em campo. Card de abertura da Season 8.',
    '/cards/s8-w01-001.svg',
    v_now - interval '5 days', v_now - interval '3 days',
    true, true, 1
  ),
  (
    v_col, 'S8-W02-002', '02', 'Muralha', 'Goleiro · Rodada 2',
    'Última linha. Presença absoluta no gol.',
    '/cards/s8-w02-002.svg',
    v_now - interval '3 days', v_now - interval '1 day',
    true, true, 2
  ),
  (
    v_col, 'S8-W02-005', '03', 'Canhoto', 'Ponta · Rodada 2',
    'Aceleração pela ponta esquerda.',
    '/cards/s8-w02-005.svg',
    v_now - interval '4 days', v_now - interval '2 days',
    true, true, 3
  );

  -- Live + LE
  insert into public.cards (
    collection_id, code, number, title, subtitle, description, image_path,
    drop_starts_at, drop_ends_at, is_public, is_active, order_display,
    le_enabled, le_quota, le_awarded, le_target_pool, le_image_path
  ) values (
    v_col, 'S8-W03-003', '04', 'Raio', 'Meia · Rodada 3',
    'Meia criativo da Season 8. Drop aberto — salve na janela.',
    '/cards/s8-w03-003.svg',
    v_now - interval '6 hours', v_now + interval '18 hours',
    true, true, 4,
    true, 3, 0, 40, '/cards/s8-w03-003-le.svg'
  );

  -- Upcoming (ativo, público, antes do drop → slot / em breve)
  insert into public.cards (
    collection_id, code, number, title, subtitle, description, image_path,
    drop_starts_at, drop_ends_at, is_public, is_active, order_display
  ) values (
    v_col, 'S8-W04-004', '05', '', '', 'Surpresa da rodada — aguarde o drop.',
    '/cards/s8-w04-004.svg',
    v_now + interval '2 days', v_now + interval '4 days',
    true, true, 5
  );

  -- Slot reservado: público + inativo (espaço vazio no álbum)
  insert into public.cards (
    collection_id, code, number, title, subtitle, description, image_path,
    drop_starts_at, drop_ends_at, is_public, is_active, order_display
  ) values (
    v_col, 'S8-SLOT-006', '06', '', '', '',
    '',
    null, null,
    true, false, 6
  );
end $$;
