-- Admin role via tabela + RLS (sem service_role no app admin)
-- Uma conta: após criar o user no Auth, rode:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'SEU_EMAIL_ADMIN';

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Usuário lê só a própria linha (para o app checar acesso)
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- =============================================================================
-- COLLECTIONS — admin full access
-- =============================================================================

drop policy if exists "collections_admin_select" on public.collections;
drop policy if exists "collections_admin_insert" on public.collections;
drop policy if exists "collections_admin_update" on public.collections;
drop policy if exists "collections_admin_delete" on public.collections;

create policy "collections_admin_select"
  on public.collections for select
  to authenticated
  using (public.is_admin());

create policy "collections_admin_insert"
  on public.collections for insert
  to authenticated
  with check (public.is_admin());

create policy "collections_admin_update"
  on public.collections for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "collections_admin_delete"
  on public.collections for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- CARDS — admin full access (incl. privados / inativos)
-- =============================================================================

drop policy if exists "cards_admin_select" on public.cards;
drop policy if exists "cards_admin_insert" on public.cards;
drop policy if exists "cards_admin_update" on public.cards;
drop policy if exists "cards_admin_delete" on public.cards;

create policy "cards_admin_select"
  on public.cards for select
  to authenticated
  using (public.is_admin());

create policy "cards_admin_insert"
  on public.cards for insert
  to authenticated
  with check (public.is_admin());

create policy "cards_admin_update"
  on public.cards for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "cards_admin_delete"
  on public.cards for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- STORAGE cards — admin write
-- =============================================================================

drop policy if exists "cards_storage_admin_insert" on storage.objects;
drop policy if exists "cards_storage_admin_update" on storage.objects;
drop policy if exists "cards_storage_admin_delete" on storage.objects;

create policy "cards_storage_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cards' and public.is_admin());

create policy "cards_storage_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cards' and public.is_admin())
  with check (bucket_id = 'cards' and public.is_admin());

create policy "cards_storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cards' and public.is_admin());
